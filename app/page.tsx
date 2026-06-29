import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sana AI — налоги и документы для ИП за 30 секунд",
  description:
    "Калькуляторы ФОТ, упрощённой декларации (910) и НДС на 2026 год — бесплатно, без регистрации. АВР, счета и накладные по формам РК для авторизованных пользователей.",
  openGraph: {
    title: "Sana AI — налоги и документы для ИП за 30 секунд",
    description:
      "Калькуляторы ФОТ, упрощённой декларации (910) и НДС на 2026 год — бесплатно, без регистрации. АВР, счета и накладные по формам РК для авторизованных пользователей.",
  },
};

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const userEmail = data.user?.email ?? "";

  return <LandingPage userEmail={userEmail} />;
}
