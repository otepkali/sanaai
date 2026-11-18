import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasActiveSubscription, type SubscriptionRow } from "./subscription";

export async function getSubscriptionServer(
  supabase: SupabaseClient,
  userId: string
): Promise<SubscriptionRow | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("Не удалось получить подписку", error);
    return null;
  }
  return (data as SubscriptionRow | null) ?? null;
}

/** Для страниц: без активной подписки уводит на /billing */
export async function requireSubscriptionPage(supabase: SupabaseClient, userId: string | undefined) {
  if (!userId) redirect("/login");
  const subscription = await getSubscriptionServer(supabase, userId);
  if (!hasActiveSubscription(subscription)) redirect("/billing");
}

/**
 * Для API: возвращает готовый ответ-ошибку, если пользователь не вошёл или
 * подписка не активна, иначе null.
 */
export async function subscriptionApiGuard(supabase: SupabaseClient): Promise<NextResponse | null> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }
  const subscription = await getSubscriptionServer(supabase, data.user.id);
  if (!hasActiveSubscription(subscription)) {
    return NextResponse.json({ error: "Нужна активная подписка" }, { status: 402 });
  }
  return null;
}
