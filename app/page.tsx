import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

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

export default function Home() {
  return <LandingPage />;
}
