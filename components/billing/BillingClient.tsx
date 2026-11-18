"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { PLAN, formatDays, type SubscriptionRow } from "@/lib/billing/subscription";
import { formatTenge } from "@/lib/format";

const FEATURES = [
  "Счета на оплату, АВР, доверенности, накладные, расчётные ведомости",
  "История всех скачанных расчётов и документов",
  "Реквизиты компании подставляются в документы автоматически",
  "Одна цена для ТОО и ИП",
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function describe(sub: SubscriptionRow, hasAccess: boolean): { title: string; text: string } {
  const until = formatDate(sub.current_period_end);
  if (!hasAccess) {
    return sub.status === "past_due"
      ? { title: "Оплата не прошла", text: "Не удалось списать оплату — доступ к документам приостановлен." }
      : { title: "Подписка закончилась", text: `Доступ закрыт с ${until}.` };
  }
  if (sub.status === "trialing") {
    return sub.cancel_at_period_end
      ? { title: "Пробный период (отменён)", text: `Доступ до ${until}, потом списаний не будет.` }
      : { title: "Пробный период", text: `Бесплатно до ${until}.` };
  }
  return sub.cancel_at_period_end
    ? { title: "Подписка отменена", text: `Доступ сохранится до ${until}, дальше списаний не будет.` }
    : { title: "Подписка активна", text: `Следующее списание ${formatTenge(sub.price_kzt)} — ${until}.` };
}

export function BillingClient() {
  const { subscription, hasAccess, isLoading, reload } = useSubscription();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function callRpc(fn: "start_trial" | "set_subscription_cancel", args?: Record<string, unknown>) {
    setIsBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc(fn, args);
      if (rpcError) {
        setError(
          rpcError.message.includes("trial_already_used")
            ? "Пробный период уже был использован."
            : "Не получилось. Попробуйте ещё раз."
        );
        return;
      }
      await reload();
    } finally {
      setIsBusy(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16 text-text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const status = subscription ? describe(subscription, hasAccess) : null;

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      {status ? (
        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader>
            <CardTitle>{status.title}</CardTitle>
            <CardDescription>{status.text}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {hasAccess ? (
              <Button asChild>
                <Link href="/documents">Перейти к документам</Link>
              </Button>
            ) : null}
            {hasAccess && subscription && !subscription.cancel_at_period_end ? (
              <Button
                variant="outline"
                disabled={isBusy}
                onClick={() => callRpc("set_subscription_cancel", { cancel: true })}
              >
                Отменить подписку
              </Button>
            ) : null}
            {hasAccess && subscription?.cancel_at_period_end ? (
              <Button
                variant="outline"
                disabled={isBusy}
                onClick={() => callRpc("set_subscription_cancel", { cancel: false })}
              >
                Возобновить подписку
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-2xl border-2 border-primary shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">{PLAN.name}</CardTitle>
          <CardDescription>
            Первые {formatDays(PLAN.trialDays)} бесплатно, дальше {formatTenge(PLAN.priceKzt)} в месяц. Отменить можно в любой
            момент.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-text">
            {formatTenge(PLAN.priceKzt)}
            <span className="ml-1 text-base font-normal text-text-muted">/ мес</span>
          </div>
          <ul className="mt-5 space-y-2.5">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-text-muted">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {feature}
              </li>
            ))}
          </ul>

          {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

          {!subscription ? (
            <Button className="mt-6 w-full gap-2" disabled={isBusy} onClick={() => callRpc("start_trial")}>
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Начать {formatDays(PLAN.trialDays)} бесплатно
            </Button>
          ) : !hasAccess ? (
            <div className="mt-6 rounded-xl border border-border bg-surface-tint p-4 text-sm text-text-muted">
              Онлайн-оплата картой скоро появится. Чтобы продлить доступ сейчас — напишите нам.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
