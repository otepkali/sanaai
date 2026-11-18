/** Единственный тариф Sana AI — одинаковый для ТОО и ИП */
export const PLAN = {
  name: "Sana AI",
  priceKzt: 5000,
  trialDays: 7,
} as const;

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

export interface SubscriptionRow {
  user_id: string;
  status: SubscriptionStatus;
  price_kzt: number;
  trial_ends_at: string | null;
  current_period_end: string;
  cancel_at_period_end: boolean;
  provider: string | null;
  provider_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Открыт ли платный функционал. Доступ есть, пока не истёк оплаченный
 * (или пробный) период — в том числе после нажатия «Отменить», до конца периода.
 * past_due (списание не прошло) доступ закрывает.
 */
export function hasActiveSubscription(row: SubscriptionRow | null, now: Date = new Date()): boolean {
  if (!row) return false;
  if (row.status === "past_due") return false;
  return new Date(row.current_period_end).getTime() > now.getTime();
}
