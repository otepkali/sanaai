-- 1) Пробный период сокращён с 7 до 3 дней (уже начатые пробные периоды не меняются).
-- 2) Админка: таблица админов и функции для просмотра пользователей и ручного
--    управления подпиской. Все функции security definer и сами проверяют, что
--    вызывающий — админ, поэтому service role ключ в приложении не нужен.
--
-- Чтобы сделать себя админом, после выполнения этого скрипта выполните:
--   insert into admins (user_id)
--   select id from auth.users where email = 'ваша@почта';

create or replace function start_trial()
returns subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  result subscriptions;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  insert into subscriptions (user_id, status, trial_ends_at, current_period_end)
  values (uid, 'trialing', now() + interval '3 days', now() + interval '3 days')
  on conflict (user_id) do nothing
  returning * into result;

  if result.user_id is null then
    raise exception 'trial_already_used';
  end if;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Админы
-- ---------------------------------------------------------------------------

create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- RLS без политик: напрямую из клиента таблицу не прочитать и не изменить.
alter table admins enable row level security;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- Список всех пользователей с подпиской и активностью
create or replace function admin_list_users()
returns table (
  user_id uuid,
  email text,
  registered_at timestamptz,
  last_sign_in_at timestamptz,
  company_name text,
  bin_iin text,
  status text,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean,
  documents_count bigint,
  calculations_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'forbidden';
  end if;

  return query
  select
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    r.company_name,
    r.bin_iin,
    s.status,
    s.trial_ends_at,
    s.current_period_end,
    s.cancel_at_period_end,
    (select count(*) from accounting_documents d where d.user_id = u.id),
    (select count(*) from calculations c where c.user_id = u.id)
  from auth.users u
  left join subscriptions s on s.user_id = u.id
  left join company_requisites r on r.user_id = u.id
  order by u.created_at desc;
end;
$$;

-- Продлить оплаченный доступ на N дней (от сегодня или от конца текущего периода — что позже).
-- Используется, пока нет онлайн-оплаты: клиент заплатил переводом — админ продлевает.
create or replace function admin_extend_subscription(target_user uuid, days integer)
returns subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  result subscriptions;
begin
  if not is_admin() then
    raise exception 'forbidden';
  end if;
  if days is null or days <= 0 or days > 3660 then
    raise exception 'invalid_days';
  end if;

  insert into subscriptions (user_id, status, current_period_end, provider)
  values (target_user, 'active', now() + make_interval(days => days), 'manual')
  on conflict (user_id) do update
  set status = 'active',
      current_period_end = greatest(subscriptions.current_period_end, now()) + make_interval(days => days),
      cancel_at_period_end = false,
      updated_at = now()
  returning * into result;

  return result;
end;
$$;

-- Закрыть доступ немедленно
create or replace function admin_revoke_subscription(target_user uuid)
returns subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  result subscriptions;
begin
  if not is_admin() then
    raise exception 'forbidden';
  end if;

  update subscriptions
  set status = 'canceled',
      current_period_end = now(),
      cancel_at_period_end = true,
      updated_at = now()
  where user_id = target_user
  returning * into result;

  if result.user_id is null then
    raise exception 'no_subscription';
  end if;

  return result;
end;
$$;

revoke all on function is_admin() from public;
revoke all on function admin_list_users() from public;
revoke all on function admin_extend_subscription(uuid, integer) from public;
revoke all on function admin_revoke_subscription(uuid) from public;
grant execute on function is_admin() to authenticated;
grant execute on function admin_list_users() to authenticated;
grant execute on function admin_extend_subscription(uuid, integer) to authenticated;
grant execute on function admin_revoke_subscription(uuid) to authenticated;
