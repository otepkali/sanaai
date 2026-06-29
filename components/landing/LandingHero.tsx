import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATS = [
  { value: "30 сек", label: "На создание документа" },
  { value: "5 форм", label: "Официальных РК" },
  { value: "0 ₸", label: "Базовый доступ" },
];

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-[#E8F5F3]">
      <div className="container relative pb-12 pt-16 lg:pb-16 lg:pt-20">
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary-bg px-4 py-1.5 text-sm font-medium text-primary">
            ✨ Налоговый AI-ассистент для Казахстана 2026
          </span>

          <h1 className="mx-auto mt-6 text-4xl font-bold tracking-tight text-text sm:text-5xl lg:text-6xl lg:leading-[1.1]">
            Налоги и документы
            <br />
            для ИП — за 30 секунд
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-text-muted">
            Калькуляторы ФОТ, упрощёнки и НДС. АВР, счета, накладные по формам РК. Всё в одном
            месте — без бухгалтера.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2 rounded-xl bg-primary px-8 py-6 text-base text-white hover:bg-primary-hover">
              <Link href="/calculators">
                Попробовать бесплатно
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-xl border-primary px-8 py-6 text-base text-primary hover:bg-primary-bg"
            >
              <a href="#how-it-works">Смотреть как работает ↓</a>
            </Button>
          </div>

          <div className="mt-12 flex items-center justify-center divide-x divide-border">
            {STATS.map((stat) => (
              <div key={stat.label} className="px-6 text-center first:pl-0 last:pr-0">
                <div className="text-2xl font-bold text-primary sm:text-3xl">{stat.value}</div>
                <div className="mt-1 text-xs text-text-muted sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="relative z-10 mx-auto mt-8 max-w-3xl translate-y-8 rounded-2xl border border-border bg-white p-2 shadow-soft">
            <span className="absolute -left-6 -top-6 hidden h-14 w-14 animate-float items-center justify-center rounded-2xl bg-white text-2xl shadow-soft sm:flex">
              💰
            </span>
            <span className="absolute -right-6 -top-6 hidden h-14 w-14 animate-float-delayed items-center justify-center rounded-2xl bg-white text-2xl shadow-soft sm:flex">
              📈
            </span>

            <div className="overflow-hidden rounded-xl border border-border bg-surface-tint">
              <div className="flex items-center gap-2 border-b border-border bg-white px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                <span className="ml-3 text-xs text-text-muted">sanaai-six.vercel.app/calculators</span>
              </div>
              <div className="grid gap-3 p-6 text-left sm:grid-cols-3">
                <div className="rounded-xl bg-white p-4 shadow-soft">
                  <div className="text-xs text-text-muted">Оклад сотрудника</div>
                  <div className="mt-1 text-lg font-semibold text-text">300 000 ₸</div>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-soft">
                  <div className="text-xs text-text-muted">ОПВ + ВОСМС + ИПН</div>
                  <div className="mt-1 text-lg font-semibold text-text">61 200 ₸</div>
                </div>
                <div className="rounded-xl bg-primary-bg p-4 shadow-soft">
                  <div className="text-xs text-primary">К выплате на руки</div>
                  <div className="mt-1 text-lg font-semibold text-primary">238 800 ₸</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
