"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasActiveSubscription, type SubscriptionRow } from "@/lib/billing/subscription";
import { useUser } from "./useUser";

/** Подписка текущего пользователя на клиенте */
export function useSubscription() {
  const { user, isLoading: isUserLoading } = useUser();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(isUserLoading);
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) console.error("Не удалось получить подписку", error);
    setSubscription((data as SubscriptionRow | null) ?? null);
    setIsLoading(false);
  }, [user, isUserLoading]);

  useEffect(() => {
    // Отложено на микрозадачу — тот же приём, что в useUser/HistorySidebar.
    Promise.resolve().then(() => reload());
  }, [reload]);

  return {
    user,
    subscription,
    hasAccess: hasActiveSubscription(subscription),
    isLoading,
    reload,
  };
}
