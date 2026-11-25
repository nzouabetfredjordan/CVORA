-- Run once in Supabase SQL Editor after schema.sql and wallet.sql.
create table if not exists public.payment_records(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 reference text not null unique, amount_xaf bigint not null check(amount_xaf>0), kind text not null,
 created_at timestamptz not null default now()
);
create table if not exists public.subscriptions(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 plan_code text not null check(plan_code in ('day1','day2','month4')), price_xaf bigint not null,
 starts_at timestamptz not null default now(), ends_at timestamptz not null,
 status text not null default 'active', reference text not null unique,
 cv_total int not null, letter_total int not null, job_total int not null, stage_total int not null,
 cv_used int not null default 0, letter_used int not null default 0, job_used int not null default 0, stage_used int not null default 0
);
create table if not exists public.subscription_usage(
 id uuid primary key default gen_random_uuid(), subscription_id uuid not null references public.subscriptions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, document_type text not null check(document_type in ('cv','letter','job','stage')),
 reference text not null unique, created_at timestamptz not null default now()
);
create index if not exists subscriptions_user_end_idx on public.subscriptions(user_id,ends_at desc);
create index if not exists payment_records_created_idx on public.payment_records(created_at desc);
create index if not exists subscription_usage_created_idx on public.subscription_usage(created_at desc);
alter table public.payment_records enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_usage enable row level security;
drop policy if exists "Admin read payment records" on public.payment_records;
create policy "Admin read payment records" on public.payment_records for select to authenticated using(public.is_cvora_admin());
drop policy if exists "Users read own subscriptions" on public.subscriptions;
create policy "Users read own subscriptions" on public.subscriptions for select to authenticated using(auth.uid()=user_id);
drop policy if exists "Admin read all subscriptions" on public.subscriptions;
create policy "Admin read all subscriptions" on public.subscriptions for select to authenticated using(public.is_cvora_admin());
drop policy if exists "Users read own subscription usage" on public.subscription_usage;
create policy "Users read own subscription usage" on public.subscription_usage for select to authenticated using(auth.uid()=user_id);
drop policy if exists "Admin read subscription usage" on public.subscription_usage;
create policy "Admin read subscription usage" on public.subscription_usage for select to authenticated using(public.is_cvora_admin());
revoke all on public.payment_records,public.subscriptions,public.subscription_usage from anon,authenticated;
grant select on public.payment_records,public.subscriptions,public.subscription_usage to authenticated;

create or replace function public.cvora_record_payment(p_user uuid,p_reference text,p_amount bigint,p_kind text)
returns void language plpgsql security definer set search_path=public as $$
begin
 if p_amount<1 or p_kind not in ('document','wallet','subscription') then raise exception 'Invalid payment record'; end if;
 insert into public.payment_records(user_id,reference,amount_xaf,kind) values(p_user,p_reference,p_amount,p_kind) on conflict(reference) do nothing;
end $$;
revoke all on function public.cvora_record_payment(uuid,text,bigint,text) from public,anon,authenticated;
grant execute on function public.cvora_record_payment(uuid,text,bigint,text) to service_role;

create or replace function public.cvora_wallet_credit(p_user uuid,p_amount bigint,p_reference text,p_description text default 'Recharge portefeuille')
returns bigint language plpgsql security definer set search_path=public as $$
declare v_balance bigint;
begin
 if p_amount not in (2000,5000,10000,20000) or p_reference !~ ('^CVORA-WALLET-'||p_user::text||'-[a-f0-9-]{36}$') then raise exception 'Invalid wallet credit'; end if;
 insert into public.wallet_accounts(user_id) values(p_user) on conflict(user_id) do nothing;
 insert into public.wallet_transactions(user_id,amount_xaf,kind,reference,description) values(p_user,p_amount,'topup',p_reference,left(p_description,160)) on conflict(reference) do nothing;
 if found then
  update public.wallet_accounts set balance_xaf=balance_xaf+p_amount,updated_at=now() where user_id=p_user returning balance_xaf into v_balance;
  insert into public.payment_records(user_id,reference,amount_xaf,kind) values(p_user,p_reference,p_amount,'wallet') on conflict(reference) do nothing;
 else select balance_xaf into v_balance from public.wallet_accounts where user_id=p_user; end if;
 return v_balance;
end $$;
revoke all on function public.cvora_wallet_credit(uuid,bigint,text,text) from public,anon,authenticated;
grant execute on function public.cvora_wallet_credit(uuid,bigint,text,text) to service_role;

create or replace function public.cvora_activate_subscription(p_user uuid,p_plan text,p_reference text,p_amount bigint)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_price int; v_count int; v_days int; v_id uuid; v_end timestamptz;
begin
 v_price:=case p_plan when 'day1' then 1500 when 'day2' then 2500 when 'month4' then 9500 else null end;
 if v_price is null or p_amount<>v_price or p_reference !~ ('^CVORA-SUB-'||p_user::text||'-'||p_plan||'-[a-f0-9-]{36}$') then raise exception 'Invalid subscription payment'; end if;
 select id into v_id from public.subscriptions where reference=p_reference;
 if v_id is not null then return (select to_jsonb(s) from public.subscriptions s where s.id=v_id); end if;
 v_days:=case when p_plan='month4' then 30 else 1 end;
 update public.subscriptions set status='replaced' where user_id=p_user and status='active' and ends_at>now();
 insert into public.subscriptions(user_id,plan_code,price_xaf,starts_at,ends_at,reference,cv_total,letter_total,job_total,stage_total)
 values(p_user,p_plan,v_price,now(),now()+make_interval(days=>v_days),p_reference,case p_plan when 'day1' then 1 when 'day2' then 2 else 4 end,case p_plan when 'day1' then 1 when 'day2' then 2 else 4 end,case p_plan when 'day1' then 1 when 'day2' then 2 else 4 end,case p_plan when 'day1' then 1 when 'day2' then 2 else 4 end) returning id,ends_at into v_id,v_end;
 insert into public.payment_records(user_id,reference,amount_xaf,kind) values(p_user,p_reference,p_amount,'subscription') on conflict(reference) do nothing;
 return jsonb_build_object('id',v_id,'ends_at',v_end);
end $$;
revoke all on function public.cvora_activate_subscription(uuid,text,text,bigint) from public,anon,authenticated;
grant execute on function public.cvora_activate_subscription(uuid,text,text,bigint) to service_role;

create or replace function public.cvora_subscription_status(p_type text default null)
returns jsonb language plpgsql stable security definer set search_path=public,auth as $$
declare s public.subscriptions%rowtype; left_count int; quota int; used int;
begin
 select * into s from public.subscriptions where user_id=auth.uid() and status='active' and ends_at>now() order by ends_at desc limit 1;
 if not found then return jsonb_build_object('active',false); end if;
 if p_type is not null then
  quota:=case p_type when 'cv' then s.cv_total when 'letter' then s.letter_total when 'job' then s.job_total when 'stage' then s.stage_total else 0 end;
  used:=case p_type when 'cv' then s.cv_used when 'letter' then s.letter_used when 'job' then s.job_used when 'stage' then s.stage_used else 0 end;
  left_count:=greatest(0,quota-used);
 else left_count:=0; end if;
 return jsonb_build_object('active',true,'id',s.id,'plan_code',s.plan_code,'starts_at',s.starts_at,'ends_at',s.ends_at,'cv_total',s.cv_total,'cv_used',s.cv_used,'letter_total',s.letter_total,'letter_used',s.letter_used,'job_total',s.job_total,'job_used',s.job_used,'stage_total',s.stage_total,'stage_used',s.stage_used,'remaining',left_count);
end $$;
revoke all on function public.cvora_subscription_status(text) from public;
grant execute on function public.cvora_subscription_status(text) to authenticated;

create or replace function public.cvora_subscription_consume(p_type text,p_reference text)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare s public.subscriptions%rowtype; v_total int; v_used int;
begin
 if p_type not in ('cv','letter','job','stage') or p_reference !~ '^CVORA-ENTITLEMENT-[a-f0-9-]{36}$' then raise exception 'Invalid document entitlement'; end if;
 select * into s from public.subscriptions where user_id=auth.uid() and status='active' and ends_at>now() order by ends_at desc limit 1 for update;
 if not found then raise exception 'No active subscription'; end if;
 v_total:=case p_type when 'cv' then s.cv_total when 'letter' then s.letter_total when 'job' then s.job_total else s.stage_total end;
 v_used:=case p_type when 'cv' then s.cv_used when 'letter' then s.letter_used when 'job' then s.job_used else s.stage_used end;
 if v_used>=v_total then raise exception 'Subscription quota exhausted'; end if;
 insert into public.subscription_usage(subscription_id,user_id,document_type,reference) values(s.id,auth.uid(),p_type,p_reference);
 update public.subscriptions set cv_used=cv_used+case when p_type='cv' then 1 else 0 end,letter_used=letter_used+case when p_type='letter' then 1 else 0 end,job_used=job_used+case when p_type='job' then 1 else 0 end,stage_used=stage_used+case when p_type='stage' then 1 else 0 end where id=s.id returning * into s;
 return jsonb_build_object('active',true,'ends_at',s.ends_at,'cv_used',s.cv_used,'letter_used',s.letter_used,'job_used',s.job_used,'stage_used',s.stage_used);
end $$;
revoke all on function public.cvora_subscription_consume(text,text) from public;
grant execute on function public.cvora_subscription_consume(text,text) to authenticated;

drop function if exists public.cvora_admin_analytics(text,date,date);
create function public.cvora_admin_analytics(p_period text default '30d',p_from date default null,p_to date default null,p_grain text default 'day')
returns jsonb language plpgsql stable security definer set search_path=public,auth as $$
declare d1 date; d2 date; result jsonb; v_step interval;
begin
 if not public.is_cvora_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 if p_grain not in ('day','week','month') then raise exception 'Invalid aggregation'; end if;
 v_step:=case p_grain when 'week' then interval '1 week' when 'month' then interval '1 month' else interval '1 day' end;
 d2:=current_date+1;
 d1:=case p_period when 'today' then current_date when '7d' then current_date-6 when '30d' then current_date-29 when '3m' then current_date-89 when '6m' then current_date-179 when 'year' then date_trunc('year',current_date)::date when 'custom' then coalesce(p_from,current_date-29) else current_date-29 end;
 if p_period='custom' then d2:=coalesce(p_to,current_date)+1; end if;
 if d2<=d1 or d2-d1>370 then raise exception 'Invalid date range'; end if;
 select jsonb_build_object(
  'period',jsonb_build_object('from',d1,'to',d2-1),
  'kpi',jsonb_build_object('users',(select count(*) from public.profiles),'active',(select count(distinct user_id) from public.activity_events where created_at>=d1 and created_at<d2),'newUsers',(select count(*) from public.profiles where created_at>=d1 and created_at<d2),'documents',(select count(*) from public.documents where created_at>=d1 and created_at<d2),'cv',(select count(*) from public.documents where document_type='cv' and created_at>=d1 and created_at<d2),'letters',(select count(*) from public.documents where document_type='letter' and created_at>=d1 and created_at<d2),'jobs',(select count(*) from public.documents where document_type='job' and created_at>=d1 and created_at<d2),'stages',(select count(*) from public.documents where document_type='stage' and created_at>=d1 and created_at<d2),'downloads',(select count(*) from public.activity_events where event_type in ('download_pdf','download_word') and created_at>=d1 and created_at<d2),'revenue',(select coalesce(sum(amount_xaf),0) from public.payment_records where created_at>=d1 and created_at<d2)),
  'series',coalesce((select jsonb_agg(jsonb_build_object('day',to_char(g.period,'YYYY-MM-DD'),'users',(select count(*) from public.profiles p where p.created_at>=greatest(g.period,d1::timestamp) and p.created_at<least(g.period+v_step,d2::timestamp)),'active',(select count(distinct e.user_id) from public.activity_events e where e.created_at>=greatest(g.period,d1::timestamp) and e.created_at<least(g.period+v_step,d2::timestamp)),'cv',(select count(*) from public.documents d where d.document_type='cv' and d.created_at>=greatest(g.period,d1::timestamp) and d.created_at<least(g.period+v_step,d2::timestamp)),'letters',(select count(*) from public.documents d where d.document_type='letter' and d.created_at>=greatest(g.period,d1::timestamp) and d.created_at<least(g.period+v_step,d2::timestamp)),'jobs',(select count(*) from public.documents d where d.document_type='job' and d.created_at>=greatest(g.period,d1::timestamp) and d.created_at<least(g.period+v_step,d2::timestamp)),'stages',(select count(*) from public.documents d where d.document_type='stage' and d.created_at>=greatest(g.period,d1::timestamp) and d.created_at<least(g.period+v_step,d2::timestamp)),'logins',(select count(*) from public.activity_events e where e.event_type='login' and e.created_at>=greatest(g.period,d1::timestamp) and e.created_at<least(g.period+v_step,d2::timestamp)),'downloads',(select count(*) from public.activity_events e where e.event_type in ('download_pdf','download_word') and e.created_at>=greatest(g.period,d1::timestamp) and e.created_at<least(g.period+v_step,d2::timestamp)),'revenue',(select coalesce(sum(amount_xaf),0) from public.payment_records pr where pr.created_at>=greatest(g.period,d1::timestamp) and pr.created_at<least(g.period+v_step,d2::timestamp))) order by g.period) from generate_series(date_trunc(p_grain,d1::timestamp),date_trunc(p_grain,(d2-1)::timestamp),v_step) as g(period)),'[]'::jsonb),
  'distribution',jsonb_build_object('cv',(select count(*) from public.documents where document_type='cv' and created_at>=d1 and created_at<d2),'letter',(select count(*) from public.documents where document_type='letter' and created_at>=d1 and created_at<d2),'job',(select count(*) from public.documents where document_type='job' and created_at>=d1 and created_at<d2),'stage',(select count(*) from public.documents where document_type='stage' and created_at>=d1 and created_at<d2)),
  'subscriptions',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'user_id',s.user_id,'email',p.email,'plan_code',s.plan_code,'price_xaf',s.price_xaf,'starts_at',s.starts_at,'ends_at',s.ends_at,'status',case when s.ends_at<=now() then 'expired' else s.status end,'cv_total',s.cv_total,'cv_used',s.cv_used,'letter_total',s.letter_total,'letter_used',s.letter_used,'job_total',s.job_total,'job_used',s.job_used,'stage_total',s.stage_total,'stage_used',s.stage_used,'usage',coalesce((select jsonb_agg(jsonb_build_object('document_type',u.document_type,'created_at',u.created_at) order by u.created_at) from public.subscription_usage u where u.subscription_id=s.id),'[]'::jsonb)) order by s.starts_at desc) from (select * from public.subscriptions where starts_at>=d1 and starts_at<d2 order by starts_at desc limit 250) s left join public.profiles p on p.id=s.user_id),'[]'::jsonb)
 ) into result;
 return result;
end $$;
revoke all on function public.cvora_admin_analytics(text,date,date,text) from public;
grant execute on function public.cvora_admin_analytics(text,date,date,text) to authenticated;

do $$ begin alter publication supabase_realtime add table public.payment_records; exception when duplicate_object then null; when duplicate_table then null; end $$;
do $$ begin alter publication supabase_realtime add table public.subscriptions; exception when duplicate_object then null; when duplicate_table then null; end $$;
do $$ begin alter publication supabase_realtime add table public.subscription_usage; exception when duplicate_object then null; when duplicate_table then null; end $$;

notify pgrst, 'reload schema';
