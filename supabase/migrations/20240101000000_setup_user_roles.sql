-- Create a custom type for user roles
create type public.app_role as enum ('admin', 'user');

-- Create a table for user profiles
create table public.profiles (
  id uuid not null primary key references auth.users on delete cascade,
  full_name text,
  role public.app_role not null default 'user',
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- RLS Policies: Users can view all profiles, but only manage their own
create policy "Public profiles are viewable by everyone." 
  on public.profiles 
  for select 
  using (true);

create policy "Users can insert their own profile." 
  on public.profiles 
  for insert 
  with check (auth.uid() = id);

create policy "Users can update own profile." 
  on public.profiles 
  for update 
  using (auth.uid() = id);

-- Trigger function to automatically create a profile for new sign-ups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function when a new user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

