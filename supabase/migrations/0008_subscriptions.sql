-- Подписка Sana AI: 5000 ₸ в месяц, пробный период (см. 0009 — сейчас 3 дня). Одна строка на пользователя.
--
-- Пользователь может только ЧИТАТЬ свою строку. Создавать и менять её можно
-- лишь через security definer функции ниже (пробный период, отмена/возобновление),
-- а после подключения платёжного провайдера — из серверного webhook с service role.
-- Так пользователь не может сам выдать себе подписку через клиентский Supabase.

create table if not exists subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  -- trialing — пробный период; active — оплачено; past_due — списание не прошло;
  -- canceled — подписка закончилась после отмены
  status text not null check (status in ('trialing', 'active', 'past_due', 'canceled')),
  price_kzt integer not null default 5000,
  trial_ends_at timestamptz,
  -- доступ открыт до этого момента (для пробного периода = trial_ends_at)
  current_period_end timestamptz not null,
  -- пользователь нажал «Отменить»: доступ сохраняется до current_period_end, дальше не списываем
  cancel_at_period_end boolean not null default false,
  provider text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table subscriptions enable row level security;

drop policy if exists "users_read_own_subscription" on subscriptions;
create policy "users_read_own_subscription" on subscriptions
  for select using (auth.uid() = user_id);

-- Запускает 7-дневный пробный период. Только один раз на аккаунт.
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
  values (uid, 'trialing', now() + interval '7 days', now() + interval '7 days')
  on conflict (user_id) do nothing
  returning * into result;

  if result.user_id is null then
    raise exception 'trial_already_used';
  end if;

  return result;
end;
$$;

-- Отмена (cancel = true) или возобновление (cancel = false) автопродления.
create or replace function set_subscription_cancel(cancel boolean)
returns subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  result subscriptions;
begin
  update subscriptions
  set cancel_at_period_end = cancel, updated_at = now()
  where user_id = auth.uid()
  returning * into result;

  if result.user_id is null then
    raise exception 'no_subscription';
  end if;

  return result;
end;
$$;

revoke all on function start_trial() from public;
revoke all on function set_subscription_cancel(boolean) from public;
grant execute on function start_trial() to authenticated;
grant execute on function set_subscription_cancel(boolean) to authenticated;
