create extension if not exists "pgcrypto";

create type vehicle_status as enum ('available', 'in_use');
create type booking_status as enum ('active', 'upcoming', 'completed', 'overdue');

create table if not exists public.vehicles (
  id text primary key,
  name text not null,
  color text not null check (color in ('blue', 'yellow', 'red', 'green')),
  status vehicle_status not null default 'available'
);

create table if not exists public.bookings (
  id text primary key,
  vehicle_id text not null references public.vehicles(id) on delete restrict,
  incharge_name text not null,
  mobile_number text not null,
  zone text not null,
  fellowship text not null,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  duration integer not null,
  status booking_status not null default 'upcoming',
  purpose text,
  actual_total_hours numeric,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint valid_time_range check (end_time > start_time),
  constraint max_five_hours check (duration <= 300)
);

create index if not exists bookings_vehicle_date_idx on public.bookings(vehicle_id, booking_date);
create index if not exists bookings_mobile_date_idx on public.bookings(mobile_number, booking_date);
create index if not exists bookings_zone_date_idx on public.bookings(zone, booking_date);
create index if not exists bookings_status_idx on public.bookings(status);

alter publication supabase_realtime add table public.vehicles;
alter publication supabase_realtime add table public.bookings;

alter table public.vehicles enable row level security;
alter table public.bookings enable row level security;

create policy "Vehicles are public readable"
on public.vehicles for select
to anon, authenticated
using (true);

create policy "Bookings public limited read"
on public.bookings for select
to anon, authenticated
using (true);

create policy "Public can create bookings"
on public.bookings for insert
to anon, authenticated
with check (true);

create policy "Users can complete bookings by mobile"
on public.bookings for update
to anon, authenticated
using (status in ('active', 'overdue'))
with check (status = 'completed');

insert into public.vehicles (id, name, color, status) values
  ('HV-01', 'Blue Vehicle', 'blue', 'available'),
  ('HV-02', 'Yellow Vehicle', 'yellow', 'available'),
  ('HV-03', 'Red Vehicle', 'red', 'available'),
  ('HV-04', 'Green Vehicle', 'green', 'available')
on conflict (id) do update
set name = excluded.name,
    color = excluded.color;

insert into public.bookings (
  id,
  vehicle_id,
  incharge_name,
  mobile_number,
  zone,
  fellowship,
  booking_date,
  start_time,
  end_time,
  duration,
  status,
  purpose
) values
  ('BK-1001', 'HV-01', 'Daniel Mathew', '9876543210', 'North Zone', 'Youth Fellowship', current_date, (current_time - interval '1 hour')::time, (current_time + interval '2 hour')::time, 180, 'active', 'Hospital support visit'),
  ('BK-1002', 'HV-02', 'Grace Thomas', '9123456780', 'East Zone', 'Women Fellowship', current_date, (current_time + interval '4 hour')::time, (current_time + interval '6 hour')::time, 120, 'upcoming', 'Equipment transport')
on conflict (id) do nothing;
