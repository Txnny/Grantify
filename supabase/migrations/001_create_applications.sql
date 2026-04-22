-- VinCity Grant Intelligence: arts grant applications
create table if not exists applications (
  id          text        primary key,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  grant_name  text        not null,
  artist_name text,
  status      text        not null default 'in-progress',
  session_data jsonb      not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table applications enable row level security;

create policy "Users manage own applications"
  on applications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Grantify Business: business grant applications
create table if not exists gb_applications (
  id           text        primary key,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  grant_name   text        not null,
  company_name text,
  status       text        not null default 'in-progress',
  session_data jsonb       not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table gb_applications enable row level security;

create policy "Users manage own gb_applications"
  on gb_applications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
