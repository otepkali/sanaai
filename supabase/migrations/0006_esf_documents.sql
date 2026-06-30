-- ЭСФ (электронные счета-фактуры), отправляемые через ИС ЭСФ КГД РК.
create table if not exists esf_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  document_number text not null,
  document_date date not null,
  buyer_bin text,
  buyer_name text,
  buyer_email text,
  total_sum numeric,
  total_nds numeric,
  total_with_nds numeric,
  items jsonb,
  xml_content text,
  signed_xml text,
  status text not null default 'draft', -- draft | signed | sent | error
  esf_id text,
  error_message text,
  created_at timestamptz default now(),
  sent_at timestamptz
);

alter table esf_documents enable row level security;

create policy "users_own_esf" on esf_documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Сохранённые контрагенты (покупатели), для автодополнения по БИН/ИИН при выписке ЭСФ.
create table if not exists esf_counterparties (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  bin_iin text not null,
  name text not null default '',
  address text not null default '',
  email text not null default '',
  created_at timestamptz default now(),
  unique (user_id, bin_iin)
);

alter table esf_counterparties enable row level security;

create policy "users_own_esf_counterparties" on esf_counterparties
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
