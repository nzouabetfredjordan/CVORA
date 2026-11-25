-- CVORA safe setup: additive only, no DROP, no table recreation, no data deletion.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  plan text not null default 'free',
  phone text,
  created_at timestamptz not null default now(),
  last_seen timestamptz
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  document_type text not null default 'cv',
  template_id text,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text,
  position text,
  job_description text,
  motivation_letter text,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_allowlist (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

create index if not exists documents_user_updated_idx on public.documents(user_id, updated_at desc);
create index if not exists job_applications_user_created_idx on public.job_applications(user_id, created_at desc);
create index if not exists activity_events_created_idx on public.activity_events(created_at desc);
create index if not exists profiles_last_seen_idx on public.profiles(last_seen desc);

create or replace function public.is_cvora_admin()
returns boolean language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from public.admin_allowlist
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;
revoke all on function public.is_cvora_admin() from public;
grant execute on function public.is_cvora_admin() to authenticated;

insert into public.admin_allowlist(email)
values ('startapp113@gmail.com')
on conflict (email) do nothing;

update public.profiles set role = 'admin'
where lower(email) = 'startapp113@gmail.com';

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    case when lower(new.email) = 'startapp113@gmail.com' then 'admin' else 'user' end
  ) on conflict (id) do update
  set email = excluded.email,
      role = case when public.profiles.role = 'admin' then 'admin' else excluded.role end,
      full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name);
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created after insert on auth.users
    for each row execute procedure public.handle_new_user();
  end if;
end $$;

create or replace function public.cvora_touch_last_seen()
returns void language sql security definer set search_path = public, auth as $$
  update public.profiles set last_seen = now() where id = auth.uid()
$$;
revoke all on function public.cvora_touch_last_seen() from public;
grant execute on function public.cvora_touch_last_seen() to authenticated;

create or replace function public.cvora_admin_dashboard()
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare result jsonb;
begin
  if not public.is_cvora_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'online', (select count(*) from public.profiles where last_seen > now() - interval '5 minutes'),
    'documents', (select count(*) from public.documents),
    'applications', (select count(*) from public.job_applications),
    'recentUsers', coalesce((select jsonb_agg(jsonb_build_object(
      'id', p.id, 'name', p.full_name, 'email', p.email, 'plan', p.plan,
      'created_at', p.created_at, 'last_seen', p.last_seen,
      'documents', (select count(*) from public.documents d where d.user_id = p.id)
    ) order by p.created_at desc) from (select * from public.profiles order by created_at desc limit 100) p), '[]'::jsonb),
    'recentActivity', coalesce((select jsonb_agg(jsonb_build_object(
      'event_type', e.event_type, 'created_at', e.created_at, 'user_email', p.email
    ) order by e.created_at desc) from (select * from public.activity_events order by created_at desc limit 50) e
      left join public.profiles p on p.id = e.user_id), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.cvora_admin_dashboard() from public;
grant execute on function public.cvora_admin_dashboard() to authenticated;

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.job_applications enable row level security;
alter table public.activity_events enable row level security;
alter table public.admin_allowlist enable row level security;

create policy if not exists "Users read own profile" on public.profiles
for select to authenticated using (auth.uid() = id);
create policy if not exists "Admins read all profiles" on public.profiles
for select to authenticated using (public.is_cvora_admin());
create policy if not exists "Users update own profile" on public.profiles
for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy if not exists "Users manage own documents" on public.documents
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "Admins read all documents" on public.documents
for select to authenticated using (public.is_cvora_admin());

create policy if not exists "Users manage own applications" on public.job_applications
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "Admins read all applications" on public.job_applications
for select to authenticated using (public.is_cvora_admin());

create policy if not exists "Users insert own activity" on public.activity_events
for insert to authenticated with check (auth.uid() = user_id);
create policy if not exists "Admins read activity" on public.activity_events
for select to authenticated using (public.is_cvora_admin());

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.documents, public.job_applications to authenticated;
grant insert on public.activity_events to authenticated;
revoke all on public.admin_allowlist from anon, authenticated;

notify pgrst, 'reload schema';

