-- Stega — pushnotiser och vinnaravgörande
-- Allt sköts i databasen: pg_net skickar pushar via Expos push-API och
-- pg_cron avgör utmaningar var 15:e minut. Ingen egen server behövs.

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- ============================================================
-- Pushtokens — en rad per enhet. Appen registrerar sin token vid
-- inloggning. Tokens är hemliga: bara ägaren kommer åt sina rader;
-- utskick sker via send_push som kör med förhöjda rättigheter.
-- ============================================================
create table public.push_tokens (
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);

alter table public.push_tokens enable row level security;
create policy "push_tokens_own" on public.push_tokens
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Skickar en push till alla enheter som hör till angivna användare.
create or replace function public.send_push(target_users uuid[], push_title text, push_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  batch jsonb;
begin
  select jsonb_agg(jsonb_build_object(
    'to', t.token,
    'title', push_title,
    'body', push_body,
    'sound', 'default'
  ))
  into batch
  from public.push_tokens t
  where t.user_id = any(target_users);

  if batch is null then
    return; -- inga registrerade enheter — helt ok
  end if;

  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := batch
  );
end;
$$;

-- ============================================================
-- Pepp — pepp-knappen i utmaningsvyn skapar en rad här; triggern
-- skickar pushen. Bara deltagare i samma utmaning kan peppa varandra.
-- ============================================================
create table public.nudges (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  from_user uuid not null references public.profiles (id) on delete cascade,
  to_user uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);

alter table public.nudges enable row level security;
create policy "nudges_insert" on public.nudges
  for insert to authenticated with check (
    from_user = auth.uid()
    and public.is_participant(challenge_id, auth.uid())
    and public.is_participant(challenge_id, to_user)
  );
create policy "nudges_select_own" on public.nudges
  for select to authenticated using (from_user = auth.uid() or to_user = auth.uid());

create or replace function public.notify_nudge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender text;
  challenge_title text;
begin
  select display_name into sender from public.profiles where id = new.from_user;
  select title into challenge_title from public.challenges where id = new.challenge_id;
  perform public.send_push(
    array[new.to_user],
    'En pepp från ' || sender || '! 📣',
    'Kom igen — ni tävlar i "' || challenge_title || '"'
  );
  return new;
end;
$$;

create trigger nudges_notify
  after insert on public.nudges
  for each row execute function public.notify_nudge();

-- ============================================================
-- Notis: du är utmanad
-- ============================================================
create or replace function public.notify_challenge_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inviter text;
  challenge_title text;
begin
  if new.status = 'invited' then
    select p.display_name, c.title into inviter, challenge_title
    from public.challenges c
    join public.profiles p on p.id = c.creator
    where c.id = new.challenge_id;
    perform public.send_push(
      array[new.user_id],
      'Du är utmanad! ⚡',
      inviter || ' har utmanat dig: "' || challenge_title || '"'
    );
  end if;
  return new;
end;
$$;

create trigger challenge_participants_notify
  after insert on public.challenge_participants
  for each row execute function public.notify_challenge_invite();

-- ============================================================
-- Notiser: vänförfrågan skickad och accepterad
-- ============================================================
create or replace function public.notify_friend_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_name text;
begin
  select display_name into requester_name from public.profiles where id = new.requester;
  perform public.send_push(
    array[new.addressee],
    'Ny vänförfrågan',
    requester_name || ' vill bli din vän på Stega'
  );
  return new;
end;
$$;

create trigger friendships_notify_request
  after insert on public.friendships
  for each row execute function public.notify_friend_request();

create or replace function public.notify_friend_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  addressee_name text;
begin
  if new.status = 'accepted' and old.status <> 'accepted' then
    select display_name into addressee_name from public.profiles where id = new.addressee;
    perform public.send_push(
      array[new.requester],
      'Ni är vänner nu! 🎉',
      addressee_name || ' accepterade din vänförfrågan — dags att utmana?'
    );
  end if;
  return new;
end;
$$;

create trigger friendships_notify_accepted
  after update on public.friendships
  for each row execute function public.notify_friend_accepted();

-- ============================================================
-- Vinnaravgörande. Körs var 15:e minut via pg_cron:
--   * Målbaserade (först till målet, filmvandring): avgörs när någon
--     accepterad deltagare passerat målet — ledaren över mål vinner.
--   * Tidsbaserade (flest steg, dagligt mål): avgörs dagen efter
--     slutdatumet — flest steg respektive flest klarade dagar vinner.
-- Flaggade dagar räknas aldrig. Alla deltagare får en push.
-- ============================================================
create or replace function public.resolve_challenges()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ch record;
  win_user uuid;
  winner_name text;
begin
  for ch in
    select * from public.challenges where status = 'active'
  loop
    win_user := null;

    if ch.kind in ('first_to_goal', 'journey') and ch.goal_steps is not null then
      select totals.user_id into win_user
      from (
        select p.user_id, sum(s.steps) as total
        from public.challenge_participants p
        join public.daily_steps s
          on s.user_id = p.user_id
         and s.day >= ch.starts_on
         and not s.flagged
        where p.challenge_id = ch.id and p.status = 'accepted'
        group by p.user_id
        having sum(s.steps) >= ch.goal_steps
      ) totals
      order by totals.total desc
      limit 1;
      if win_user is null then
        continue; -- ingen i mål ännu
      end if;

    elsif ch.ends_on is not null and current_date > ch.ends_on then
      select totals.user_id into win_user
      from (
        select
          p.user_id,
          case
            when ch.kind = 'daily_goal_streak'
              then count(s.day) filter (where s.steps >= ch.goal_steps)
            else coalesce(sum(s.steps), 0)
          end as total
        from public.challenge_participants p
        left join public.daily_steps s
          on s.user_id = p.user_id
         and s.day between ch.starts_on and ch.ends_on
         and not s.flagged
        where p.challenge_id = ch.id and p.status = 'accepted'
        group by p.user_id
      ) totals
      order by totals.total desc
      limit 1;

    else
      continue; -- pågår fortfarande
    end if;

    update public.challenges
    set status = 'finished', winner = win_user
    where id = ch.id;

    if win_user is not null then
      select display_name into winner_name from public.profiles where id = win_user;
      perform public.send_push(
        (select array_agg(user_id) from public.challenge_participants
         where challenge_id = ch.id and status = 'accepted'),
        'Utmaningen är avgjord! 🏆',
        winner_name || ' vann "' || ch.title || '"'
      );
    end if;
  end loop;
end;
$$;

select cron.schedule(
  'stega-resolve-challenges',
  '*/15 * * * *',
  'select public.resolve_challenges()'
);
