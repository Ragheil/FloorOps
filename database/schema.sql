create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.bays (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stations (
  id uuid primary key default gen_random_uuid(),
  bay_id uuid not null references public.bays(id) on delete cascade,
  seat_label text not null,
  pc_name text,
  ip_address text,
  agent_name text,
  agent_id text,
  status text not null default 'Vacant',
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stations_status_check check (status in ('Active', 'Vacant', 'Issue', 'Reserved'))
);

create index if not exists idx_stations_bay_id on public.stations (bay_id);
create index if not exists idx_stations_status on public.stations (status);
create index if not exists idx_stations_agent_name on public.stations (agent_name);
create index if not exists idx_stations_pc_name on public.stations (pc_name);

drop trigger if exists set_bays_updated_at on public.bays;
create trigger set_bays_updated_at
before update on public.bays
for each row
execute function public.set_updated_at();

drop trigger if exists set_stations_updated_at on public.stations;
create trigger set_stations_updated_at
before update on public.stations
for each row
execute function public.set_updated_at();
