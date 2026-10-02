-- Budget tracker: categorieën en transacties per gebruiker (Supabase Auth)

create table if not exists public.budget_categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 50),
  type        text not null check (type in ('income', 'expense')),
  color       text not null default '#7C3AED' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at  timestamptz not null default now(),
  unique (user_id, type, name)
);

create table if not exists public.budget_transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id  uuid references public.budget_categories(id) on delete set null,
  type         text not null check (type in ('income', 'expense')),
  amount       numeric(12,2) not null check (amount > 0),
  description  text check (char_length(description) <= 200),
  date         date not null default current_date,
  created_at   timestamptz not null default now()
);

create index if not exists budget_transactions_user_date_idx on public.budget_transactions (user_id, date);
create index if not exists budget_transactions_category_idx on public.budget_transactions (category_id);

alter table public.budget_categories   enable row level security;
alter table public.budget_transactions enable row level security;

create policy "budget_categories_select_own" on public.budget_categories
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "budget_categories_insert_own" on public.budget_categories
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "budget_categories_update_own" on public.budget_categories
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "budget_categories_delete_own" on public.budget_categories
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "budget_transactions_select_own" on public.budget_transactions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "budget_transactions_insert_own" on public.budget_transactions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "budget_transactions_update_own" on public.budget_transactions
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "budget_transactions_delete_own" on public.budget_transactions
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.budget_categories   to authenticated;
grant select, insert, update, delete on public.budget_transactions to authenticated;
revoke all on public.budget_categories   from anon;
revoke all on public.budget_transactions from anon;
