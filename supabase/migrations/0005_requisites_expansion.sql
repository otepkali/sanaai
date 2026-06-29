-- Расширение реквизитов компании: режим налогообложения, КБе, НДС, ЕП, логотип,
-- данные владельца ИП, несколько адресов/счетов/складов/касс, подписанты по ролям.

alter table company_requisites
  add column if not exists regime text not null default '',
  add column if not exists kbe text not null default '',
  add column if not exists is_vat_payer boolean not null default false,
  add column if not exists single_payment_status text not null default 'Неплательщик ЕП',
  add column if not exists logo_path text,
  add column if not exists owner_full_name text not null default '',
  add column if not exists residency_country text not null default 'Казахстан',
  add column if not exists owner_monthly_income numeric,
  add column if not exists owner_statuses text not null default '',
  add column if not exists tax_authority_registration text not null default '',
  add column if not exists tax_authority_residence text not null default '',
  add column if not exists akimat_bin text not null default '',
  add column if not exists registration_certificate_number text not null default '',
  add column if not exists registration_certificate_date date,
  add column if not exists currency text not null default 'KZT',
  add column if not exists stock_control_enabled boolean not null default false;

-- Адреса (юридический/фактический/другой), несколько на пользователя
create table if not exists company_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'actual',
  address text not null default '',
  sort_order int not null default 0,
  created_at timestamptz default now()
);

alter table company_addresses enable row level security;

create policy "Users manage own addresses" on company_addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Дополнительные расчётные счета (основной счёт остаётся в company_requisites.bank_name/iik/bik)
create table if not exists company_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default '',
  account_number text not null default '',
  currency text not null default 'KZT',
  bik text not null default '',
  bank_name text not null default '',
  sort_order int not null default 0,
  created_at timestamptz default now()
);

alter table company_bank_accounts enable row level security;

create policy "Users manage own bank accounts" on company_bank_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Склады
create table if not exists company_warehouses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  address text not null default '',
  sort_order int not null default 0,
  created_at timestamptz default now()
);

alter table company_warehouses enable row level security;

create policy "Users manage own warehouses" on company_warehouses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Кассы
create table if not exists company_cash_registers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  cashier_name text not null default '',
  address text not null default '',
  sort_order int not null default 0,
  created_at timestamptz default now()
);

alter table company_cash_registers enable row level security;

create policy "Users manage own cash registers" on company_cash_registers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Подписанты по ролям (главный бухгалтер, отпуск товаров, за руководителя/бухгалтера в С/Ф и т.д.)
-- Подпись руководителя и печать организации — отдельно, в company_requisites (signature_path/stamp_path),
-- т.к. уже используются при генерации АВР/накладной/доверенности.
create table if not exists company_signers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  full_name text not null default '',
  signature_path text,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

alter table company_signers enable row level security;

create policy "Users manage own signers" on company_signers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
