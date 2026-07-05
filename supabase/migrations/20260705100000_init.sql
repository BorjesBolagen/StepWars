-- Stega — grundschema
-- Körs mot ett Supabase-projekt (EU-region rekommenderas — hälsodata + GDPR):
--   supabase db push   (eller klistra in i SQL-editorn i Supabase Studio)

-- ============================================================
-- Profiler — en rad per användare, kopplad till Supabase Auth.
-- Födelseår (inte personnummer/födelsedatum) räcker för åldersgrupper
-- och är den minsta uppgift vi kan samla in.
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 50),
  birth_year int not null check (birth_year between 1900 and extract(year from now())),
  daily_goal int not null default 10000 check (daily_goal between 1000 and 50000),
  created_at timestamptz not null default now()
);

-- Åldersgrupp beräknas ur födelseår — samma indelning i hela appen.
create or replace function public.age_group(birth_year int)
returns text
language sql
immutable
as $$
  select case
    when extract(year from now()) - birth_year < 18 then 'Under 18'
    when extract(year from now()) - birth_year < 25 then '18–24'
    when extract(year from now()) - birth_year < 35 then '25–34'
    when extract(year from now()) - birth_year < 45 then '35–44'
    when extract(year from now()) - birth_year < 55 then '45–54'
    when extract(year from now()) - birth_year < 65 then '55–64'
    else '65+'
  end;
$$;

-- ============================================================
-- Vänskaper — riktad förfrågan som blir ömsesidig när den accepteras.
-- ============================================================
create table public.friendships (
  requester uuid not null references public.profiles (id) on delete cascade,
  addressee uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  primary key (requester, addressee),
  check (requester <> addressee)
);

create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and ((requester = a and addressee = b) or (requester = b and addressee = a))
  );
$$;

-- ============================================================
-- Dagliga steg — en rad per användare och dag, uppdateras vid synk
-- från HealthKit / Health Connect. Grunden för alla topplistor.
-- ============================================================
create table public.daily_steps (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  steps int not null check (steps >= 0),
  source text not null default 'healthkit' check (source in ('healthkit', 'health_connect')),
  flagged boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create index daily_steps_day_idx on public.daily_steps (day);

-- Fuskskydd, första försvarslinjen: dagar med orimligt många steg flaggas
-- och räknas inte i topplistor förrän de granskats. 60 000 steg ≈ 45 km.
create or replace function public.flag_unreasonable_steps()
returns trigger
language plpgsql
as $$
begin
  new.flagged := new.steps > 60000;
  new.updated_at := now();
  return new;
end;
$$;

create trigger daily_steps_flag
  before insert or update on public.daily_steps
  for each row execute function public.flag_unreasonable_steps();

-- ============================================================
-- Utmaningar — de tre typerna från designen:
--   most_steps        Flest steg under en period
--   first_to_goal     Först till ett antal steg (öppet slutdatum)
--   daily_goal_streak Klara X steg/dag — längsta sviten vinner
-- En duell och en gruppliga är samma sak: olika antal deltagare.
-- ============================================================
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  creator uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('most_steps', 'first_to_goal', 'daily_goal_streak')),
  title text not null check (char_length(title) between 1 and 80),
  goal_steps int check (goal_steps > 0),
  starts_on date not null default current_date,
  ends_on date,
  status text not null default 'active' check (status in ('active', 'finished', 'cancelled')),
  winner uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  -- first_to_goal och daily_goal_streak kräver ett mål; most_steps kräver slutdatum.
  check (kind = 'most_steps' or goal_steps is not null),
  check (kind <> 'most_steps' or ends_on is not null)
);

create table public.challenge_participants (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'invited' check (status in ('invited', 'accepted', 'declined')),
  invited_at timestamptz not null default now(),
  responded_at timestamptz,
  primary key (challenge_id, user_id)
);

create or replace function public.is_participant(cid uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.challenge_participants
    where challenge_id = cid and user_id = uid
  );
$$;

-- ============================================================
-- Row Level Security
-- Anon-nyckeln ligger i appen och är publik — all åtkomstkontroll bor här.
-- ============================================================
alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.daily_steps enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;

-- Profiler: alla inloggade kan se namn + åldersgrupp (krävs för "Alla"-ligan);
-- bara du kan skapa och ändra din egen profil.
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid());

-- Vänskaper: du ser förfrågningar du är del av; du kan skicka egna
-- och svara på dem som är ställda till dig.
create policy "friendships_select_own" on public.friendships
  for select to authenticated using (requester = auth.uid() or addressee = auth.uid());
create policy "friendships_insert_own" on public.friendships
  for insert to authenticated with check (requester = auth.uid());
create policy "friendships_respond" on public.friendships
  for update to authenticated using (addressee = auth.uid());

-- Steg: du skriver bara dina egna. Läsning: egna steg, vänners steg och
-- steg för deltagare i utmaningar du själv deltar i. Publika topplistor
-- ("Alla" / åldersgrupp) exponeras enbart aggregerat via vyn nedan.
create policy "daily_steps_select" on public.daily_steps
  for select to authenticated using (
    user_id = auth.uid()
    or public.are_friends(auth.uid(), user_id)
    or exists (
      select 1
      from public.challenge_participants mine
      join public.challenge_participants theirs
        on mine.challenge_id = theirs.challenge_id
      where mine.user_id = auth.uid()
        and theirs.user_id = daily_steps.user_id
    )
  );
create policy "daily_steps_insert_own" on public.daily_steps
  for insert to authenticated with check (user_id = auth.uid());
create policy "daily_steps_update_own" on public.daily_steps
  for update to authenticated using (user_id = auth.uid());

-- Utmaningar: synliga för deltagare; alla kan skapa; skaparen kan ändra
-- (avbryta) sin utmaning.
create policy "challenges_select_participant" on public.challenges
  for select to authenticated using (
    creator = auth.uid() or public.is_participant(id, auth.uid())
  );
create policy "challenges_insert_own" on public.challenges
  for insert to authenticated with check (creator = auth.uid());
create policy "challenges_update_creator" on public.challenges
  for update to authenticated using (creator = auth.uid());

create policy "participants_select" on public.challenge_participants
  for select to authenticated using (
    user_id = auth.uid() or public.is_participant(challenge_id, auth.uid())
  );
create policy "participants_invite" on public.challenge_participants
  for insert to authenticated with check (
    exists (
      select 1 from public.challenges
      where id = challenge_id and creator = auth.uid()
    )
  );
create policy "participants_respond" on public.challenge_participants
  for update to authenticated using (user_id = auth.uid());

-- ============================================================
-- Topplista — aggregerad vy för "Alla"- och åldersgruppsligorna.
-- security_invoker är avstängt medvetet: vyn är den kontrollerade kanalen
-- som visar namn, åldersgrupp och stegsumma (aldrig rådata per dag)
-- för alla användare. Flaggade dagar räknas inte.
-- ============================================================
create view public.leaderboard_weekly
with (security_invoker = false) as
select
  p.id as user_id,
  p.display_name,
  public.age_group(p.birth_year) as age_group,
  date_trunc('week', s.day)::date as week_start,
  sum(s.steps) as total_steps,
  round(avg(s.steps)) as avg_steps_per_day
from public.daily_steps s
join public.profiles p on p.id = s.user_id
where not s.flagged
group by p.id, p.display_name, p.birth_year, date_trunc('week', s.day);

grant select on public.leaderboard_weekly to authenticated;
