create table calculations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null, -- 'fot' | 'simplified' | 'vat' | 'comparison'
  title text,
  input jsonb not null,
  result jsonb not null,
  created_at timestamptz default now()
);

alter table calculations enable row level security;

create policy "Users see own calculations" on calculations
  for all using (auth.uid() = user_id);
