
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Users can view their own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update to authenticated using (auth.uid() = id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Plants
create table public.plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  nickname text,
  species text,
  location text,
  cover_image_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.plants enable row level security;
create index plants_user_id_idx on public.plants(user_id);

create policy "Users can view their own plants" on public.plants for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert their own plants" on public.plants for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own plants" on public.plants for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete their own plants" on public.plants for delete to authenticated using (auth.uid() = user_id);

create trigger plants_set_updated_at before update on public.plants
for each row execute function public.set_updated_at();

-- Plant records (diagnoses)
create table public.plant_records (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references public.plants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  user_note text,
  ai_diagnosis jsonb,
  health_status text,
  summary text,
  created_at timestamptz not null default now()
);
alter table public.plant_records enable row level security;
create index plant_records_plant_id_idx on public.plant_records(plant_id);
create index plant_records_user_id_idx on public.plant_records(user_id);

create policy "Users can view their own records" on public.plant_records for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert their own records" on public.plant_records for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own records" on public.plant_records for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete their own records" on public.plant_records for delete to authenticated using (auth.uid() = user_id);

-- Reminders
create table public.plant_reminders (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references public.plants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  record_id uuid references public.plant_records(id) on delete set null,
  action text not null,
  priority text not null default 'medium',
  due_at timestamptz not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.plant_reminders enable row level security;
create index plant_reminders_plant_id_idx on public.plant_reminders(plant_id);
create index plant_reminders_user_id_idx on public.plant_reminders(user_id);
create index plant_reminders_due_at_idx on public.plant_reminders(due_at);

create policy "Users can view their own reminders" on public.plant_reminders for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert their own reminders" on public.plant_reminders for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own reminders" on public.plant_reminders for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete their own reminders" on public.plant_reminders for delete to authenticated using (auth.uid() = user_id);

-- Storage bucket
insert into storage.buckets (id, name, public) values ('plant-photos', 'plant-photos', true)
on conflict (id) do nothing;

create policy "Public can view plant photos" on storage.objects for select using (bucket_id = 'plant-photos');
create policy "Users can upload their own plant photos" on storage.objects for insert to authenticated with check (
  bucket_id = 'plant-photos' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Users can update their own plant photos" on storage.objects for update to authenticated using (
  bucket_id = 'plant-photos' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Users can delete their own plant photos" on storage.objects for delete to authenticated using (
  bucket_id = 'plant-photos' and auth.uid()::text = (storage.foldername(name))[1]
);
