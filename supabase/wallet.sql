-- CVORA closed-loop wallet: balances can be spent on CVORA documents only.
-- Apply in the Supabase SQL Editor after schema.sql.
create table if not exists public.wallet_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance_xaf bigint not null default 0 check (balance_xaf >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_xaf bigint not null check (amount_xaf <> 0),
  kind text not null check (kind in ('topup', 'purchase')),
  reference text not null unique,
  description text not null,
  created_at timestamptz not null default now()
);
create index if not exists wallet_transactions_user_created_idx
  on public.wallet_transactions(user_id, created_at desc);

alter table public.wallet_accounts enable row level security;
alter table public.wallet_transactions enable row level security;
drop policy if exists "Users read own wallet" on public.wallet_accounts;
create policy "Users read own wallet" on public.wallet_accounts
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users read own wallet transactions" on public.wallet_transactions;
create policy "Users read own wallet transactions" on public.wallet_transactions
  for select to authenticated using (auth.uid() = user_id);
revoke all on public.wallet_accounts, public.wallet_transactions from anon, authenticated;
grant select on public.wallet_accounts, public.wallet_transactions to authenticated;

-- Called only by the server after it verifies a completed NotchPay transaction.
create or replace function public.cvora_wallet_credit(p_user uuid, p_amount bigint, p_reference text, p_description text default 'Recharge portefeuille')
returns bigint language plpgsql security definer set search_path = public, auth as $$
declare new_balance bigint;
begin
  if p_amount < 100 or p_amount > 1000000 or p_reference !~ '^CVORA-WALLET-[a-f0-9-]{36}-[a-f0-9-]{36}$' then
    raise exception 'Invalid wallet credit';
  end if;
  insert into public.wallet_accounts(user_id) values (p_user) on conflict (user_id) do nothing;
  insert into public.wallet_transactions(user_id, amount_xaf, kind, reference, description)
    values (p_user, p_amount, 'topup', p_reference, left(p_description, 160))
    on conflict (reference) do nothing;
  if found then
    update public.wallet_accounts set balance_xaf = balance_xaf + p_amount, updated_at = now()
      where user_id = p_user returning balance_xaf into new_balance;
  else
    select balance_xaf into new_balance from public.wallet_accounts where user_id = p_user;
  end if;
  return new_balance;
end;
$$;
revoke all on function public.cvora_wallet_credit(uuid, bigint, text, text) from public, anon, authenticated;
grant execute on function public.cvora_wallet_credit(uuid, bigint, text, text) to service_role;

create or replace function public.cvora_wallet_spend(p_amount bigint, p_description text, p_reference text)
returns bigint language plpgsql security definer set search_path = public, auth as $$
declare new_balance bigint; uid uuid := auth.uid();
begin
  if uid is null or p_amount < 1 or p_amount > 1000000 or p_reference !~ '^CVORA-SPEND-[a-f0-9-]{36}$' then
    raise exception 'Invalid wallet purchase';
  end if;
  update public.wallet_accounts set balance_xaf = balance_xaf - p_amount, updated_at = now()
    where user_id = uid and balance_xaf >= p_amount returning balance_xaf into new_balance;
  if not found then raise exception 'Insufficient wallet balance'; end if;
  insert into public.wallet_transactions(user_id, amount_xaf, kind, reference, description)
    values (uid, -p_amount, 'purchase', p_reference, left(p_description, 160));
  return new_balance;
end;
$$;
revoke all on function public.cvora_wallet_spend(bigint, text, text) from public, anon;
grant execute on function public.cvora_wallet_spend(bigint, text, text) to authenticated;

grant select on public.wallet_accounts, public.wallet_transactions to authenticated;
