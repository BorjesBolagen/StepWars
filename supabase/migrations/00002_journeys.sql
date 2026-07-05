-- Stega — filmvandringar
-- Kända promenader ur filmhistorien som utmaningsbanor: vännerna tävlar om
-- vem som går hela sträckan först, med filmens platser som delmål.

create table public.journeys (
  id text primary key,
  title text not null,
  film text not null,
  description text not null,
  total_steps int not null check (total_steps > 0)
);

create table public.journey_milestones (
  journey_id text not null references public.journeys (id) on delete cascade,
  position int not null check (position >= 0),
  name text not null,
  -- Ackumulerade steg från start till detta delmål.
  steps int not null check (steps >= 0),
  primary key (journey_id, position)
);

-- Utmaningar kan nu vara filmvandringar. Målet (goal_steps) sätts från
-- vandringens total_steps när utmaningen skapas.
alter table public.challenges
  add column journey_id text references public.journeys (id);

alter table public.challenges
  drop constraint challenges_kind_check;
alter table public.challenges
  add constraint challenges_kind_check
  check (kind in ('most_steps', 'first_to_goal', 'daily_goal_streak', 'journey'));
alter table public.challenges
  add constraint challenges_journey_check
  check (kind <> 'journey' or journey_id is not null);

-- Vandringarna är gemensam, läsbar katalogdata.
alter table public.journeys enable row level security;
alter table public.journey_milestones enable row level security;
create policy "journeys_select" on public.journeys
  for select to authenticated using (true);
create policy "journey_milestones_select" on public.journey_milestones
  for select to authenticated using (true);

-- ============================================================
-- Katalog. Stegen är estimat: sträcka i km × ~1 300 steg/km.
-- Mordor bygger på fansens klassiska beräkning: Fylke → Domedagsberget
-- är 1 779 miles (≈ 2 863 km).
-- ============================================================
insert into public.journeys (id, title, film, description, total_steps) values
  ('stand-by-me', 'Längs rälsen', 'Stand by Me (1986)',
   'Pojkarnas två dagar längs järnvägen utanför Castle Rock. En lagom helgutmaning.', 52000),
  ('the-way', 'Caminon', 'The Way (2010)',
   'Pilgrimsleden till Santiago de Compostela — 780 km genom norra Spanien.', 1014000),
  ('wild', 'Pacific Crest Trail', 'Wild (2014)',
   'Cheryl Strayeds 1 770 km från Mojaveöknen till Gudarnas bro.', 2301000),
  ('mordor', 'Vägen till Mordor', 'Sagan om ringen',
   'Frodos hela vandring: Fylke till Domedagsberget, 1 779 miles.', 3722000),
  ('forrest-gump', 'Springturnén', 'Forrest Gump (1994)',
   'Forrests tre år av löpning fram och tillbaka över USA.', 31900000);

insert into public.journey_milestones (journey_id, position, name, steps) values
  ('stand-by-me', 0, 'Castle Rock', 0),
  ('stand-by-me', 1, 'Järnvägsbron', 20000),
  ('stand-by-me', 2, 'Skogen och skroten', 33000),
  ('stand-by-me', 3, 'Back Harlow Road', 52000),

  ('the-way', 0, 'Saint-Jean-Pied-de-Port', 0),
  ('the-way', 1, 'Pamplona', 88000),
  ('the-way', 2, 'Burgos', 367000),
  ('the-way', 3, 'León', 601000),
  ('the-way', 4, 'Santiago de Compostela', 1014000),

  ('wild', 0, 'Mojaveöknen', 0),
  ('wild', 1, 'Kennedy Meadows', 356000),
  ('wild', 2, 'Sierra Nevada', 900000),
  ('wild', 3, 'Ashland, Oregon', 1946000),
  ('wild', 4, 'Gudarnas bro', 2301000),

  ('mordor', 0, 'Fylke', 0),
  ('mordor', 1, 'Bri och Den stegrande ponnyn', 282000),
  ('mordor', 2, 'Vattnadal', 958000),
  ('mordor', 3, 'Morias gruvor', 1664000),
  ('mordor', 4, 'Lothlórien', 1925000),
  ('mordor', 5, 'Rauros fall', 2739000),
  ('mordor', 6, 'Svarta porten', 3349000),
  ('mordor', 7, 'Domedagsberget', 3722000),

  ('forrest-gump', 0, 'Greenbow, Alabama', 0),
  ('forrest-gump', 1, 'Santa Monica-piren', 4680000),
  ('forrest-gump', 2, 'Fyren i Maine', 11050000),
  ('forrest-gump', 3, 'Mississippifloden (varv 3)', 21000000),
  ('forrest-gump', 4, 'Monument Valley — "Jag är rätt trött"', 31900000);
