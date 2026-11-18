import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionServer } from "@/lib/billing/server";
import { hasActiveSubscription } from "@/lib/billing/subscription";

export const metadata: Metadata = {
  title: "Sana AI — налоги и документы для ИП за 30 секунд",
  description:
    "Калькуляторы ФОТ, упрощённой декларации (910) и НДС на 2026 год — бесплатно, без регистрации. АВР, счета и накладные по формам РК — по подписке.",
  openGraph: {
    title: "Sana AI — налоги и документы для ИП за 30 секунд",
    description:
      "Калькуляторы ФОТ, упрощённой декларации (910) и НДС на 2026 год — бесплатно, без регистрации. АВР, счета и накладные по формам РК — по подписке.",
  },
};

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const userEmail = data.user?.email ?? "";
  const hasSubscription = data.user
    ? hasActiveSubscription(await getSubscriptionServer(supabase, data.user.id))
    : false;

  return <LandingPage userEmail={userEmail} hasSubscription={hasSubscription} />;
}
