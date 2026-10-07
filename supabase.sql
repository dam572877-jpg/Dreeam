-- FAYOUM ESTATE — Supabase schema
create extension if not exists pgcrypto;
create table if not exists public.properties (
 id uuid primary key default gen_random_uuid(), title text not null, type text not null, area text not null,
 purpose text not null default 'بيع', price numeric not null default 0, price_text text, size numeric default 0, size_text text, category text, floor text,
 rooms int default 0, baths int default 0, status text default 'متاح', owner text, phone text, description text,
 source text, source_sheet text, source_row int, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.clients (
 id uuid primary key default gen_random_uuid(), name text not null, phone text not null, type text,
 budget numeric default 0, area text, status text default 'نشط', notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.properties enable row level security; alter table public.clients enable row level security;
-- For a private office system, replace these temporary policies with authenticated-user policies after enabling Supabase Auth.
drop policy if exists "properties_public_read" on public.properties;
drop policy if exists "properties_public_write" on public.properties;
drop policy if exists "clients_public_read" on public.clients;
drop policy if exists "clients_public_write" on public.clients;
create policy "properties_public_read" on public.properties for select using (true);
create policy "properties_public_write" on public.properties for all using (true) with check (true);
create policy "clients_public_read" on public.clients for select using (true);
create policy "clients_public_write" on public.clients for all using (true) with check (true);
create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
drop trigger if exists properties_updated_at on public.properties; create trigger properties_updated_at before update on public.properties for each row execute function public.set_updated_at();
drop trigger if exists clients_updated_at on public.clients; create trigger clients_updated_at before update on public.clients for each row execute function public.set_updated_at();

-- Excel import support for existing databases
alter table public.properties add column if not exists price_text text;
alter table public.properties add column if not exists size_text text;
alter table public.properties add column if not exists category text;
alter table public.properties add column if not exists source text;
alter table public.properties add column if not exists source_sheet text;
alter table public.properties add column if not exists source_row int;
