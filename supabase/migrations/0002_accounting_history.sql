create table accounting_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  period text not null,
  document_type text not null,
  summary jsonb not null,
  categories jsonb not null,
  anomalies jsonb,
  created_at timestamptz default now()
);

alter table accounting_history enable row level security;

create policy "Users see own accounting history" on accounting_history
  for all using (auth.uid() = user_id);
