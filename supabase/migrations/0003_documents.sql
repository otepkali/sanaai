-- Реквизиты компании пользователя (одна строка на пользователя)
create table company_requisites (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_name text not null default '',
  bin_iin text not null default '',
  is_individual_entrepreneur boolean not null default false,
  director_name text not null default '',
  accountant_name text not null default '',
  address text not null default '',
  bank_name text not null default '',
  iik text not null default '',
  bik text not null default '',
  signature_path text,
  stamp_path text,
  updated_at timestamptz default now()
);

alter table company_requisites enable row level security;

create policy "Users manage own requisites" on company_requisites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Сохранённые бухгалтерские документы (АВР, доверенность, расчётная ведомость, накладная)
create table accounting_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null, -- 'avr' | 'poa' | 'payroll' | 'waybill'
  title text,
  data jsonb not null,
  created_at timestamptz default now()
);

alter table accounting_documents enable row level security;

create policy "Users see own accounting documents" on accounting_documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Приватное хранилище для подписи и печати организации, по одной папке на пользователя
insert into storage.buckets (id, name, public) values ('company-files', 'company-files', false);

create policy "Users manage own company files" on storage.objects
  for all
  using (bucket_id = 'company-files' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'company-files' and (storage.foldername(name))[1] = auth.uid()::text);
