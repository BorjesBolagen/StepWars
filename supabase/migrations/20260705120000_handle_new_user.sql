-- Stega — automatiskt profilskapande
-- Appen skickar med namn och födelseår som metadata vid registrering;
-- den här triggern skapar profilraden så att klienten aldrig behöver
-- (eller får) göra det själv.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, birth_year)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Ny stegare'),
    coalesce((new.raw_user_meta_data ->> 'birth_year')::int, 1990)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
