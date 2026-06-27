-- 0003 создавала бакет company-files и политику на storage.objects в одном
-- скрипте с таблицами company_requisites/accounting_documents. Похоже, именно
-- эта строка не выполнилась (бакет не создался), хотя таблицы создались.
-- Этот скрипт идемпотентен — безопасно выполнить повторно.

insert into storage.buckets (id, name, public)
values ('company-files', 'company-files', false)
on conflict (id) do nothing;

drop policy if exists "Users manage own company files" on storage.objects;

create policy "Users manage own company files" on storage.objects
  for all
  using (bucket_id = 'company-files' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'company-files' and (storage.foldername(name))[1] = auth.uid()::text);
