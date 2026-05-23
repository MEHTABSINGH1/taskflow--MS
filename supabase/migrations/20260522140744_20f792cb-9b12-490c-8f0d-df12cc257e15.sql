
-- Enums
create type public.app_role as enum ('admin','user');
create type public.task_status as enum ('todo','in_progress','done');
create type public.task_priority as enum ('low','medium','high','urgent');
create type public.activity_action as enum (
  'login','logout','signup',
  'task_created','task_updated','task_deleted','task_status_changed',
  'user_activated','user_deactivated','role_changed'
);

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  unique(user_id, role)
);
alter table public.user_roles enable row level security;

-- Security definer role checker
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = 'admin')
$$;

-- Tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  due_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tasks enable row level security;
create index tasks_user_id_idx on public.tasks(user_id);
create index tasks_status_idx on public.tasks(status);
create index tasks_due_date_idx on public.tasks(due_date);

-- Activity logs
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action public.activity_action not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.activity_logs enable row level security;
create index activity_logs_user_idx on public.activity_logs(user_id);
create index activity_logs_created_idx on public.activity_logs(created_at desc);

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger tasks_touch before update on public.tasks for each row execute function public.touch_updated_at();

-- Auto-set completed_at
create or replace function public.task_set_completed()
returns trigger language plpgsql as $$
begin
  if new.status = 'done' and (old.status is distinct from 'done') then new.completed_at = now();
  elsif new.status <> 'done' then new.completed_at = null;
  end if;
  return new;
end;
$$;
create trigger tasks_completed_trigger before update on public.tasks for each row execute function public.task_set_completed();

-- New user trigger: create profile + assign user role
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS Policies: profiles
create policy "profiles_select_own_or_admin" on public.profiles for select
  using (auth.uid() = id or public.is_admin(auth.uid()));
create policy "profiles_update_own_or_admin" on public.profiles for update
  using (auth.uid() = id or public.is_admin(auth.uid()));
create policy "profiles_admin_insert" on public.profiles for insert
  with check (public.is_admin(auth.uid()));
create policy "profiles_admin_delete" on public.profiles for delete
  using (public.is_admin(auth.uid()));

-- RLS Policies: user_roles
create policy "user_roles_select_self_or_admin" on public.user_roles for select
  using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "user_roles_admin_all" on public.user_roles for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- RLS Policies: tasks
create policy "tasks_select_own_or_admin" on public.tasks for select
  using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "tasks_insert_own" on public.tasks for insert
  with check (user_id = auth.uid());
create policy "tasks_update_own_or_admin" on public.tasks for update
  using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "tasks_delete_own_or_admin" on public.tasks for delete
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- RLS Policies: activity_logs
create policy "activity_logs_insert_self" on public.activity_logs for insert
  with check (user_id = auth.uid() or user_id is null);
create policy "activity_logs_select_own_or_admin" on public.activity_logs for select
  using (user_id = auth.uid() or public.is_admin(auth.uid()));
