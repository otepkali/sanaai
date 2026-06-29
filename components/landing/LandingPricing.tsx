import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    name: "Без регистрации",
    price: "0 ₸",
    description: "Чтобы быстро что-то посчитать",
    cta: { label: "Открыть калькуляторы", href: "/calculators" },
    highlighted: false,
    features: [
      "Калькулятор ФОТ (1 сотрудник и ведомость)",
      "Упрощённая декларация 910",
      "НДС: прямой и обратный расчёт",
      "Сравнение налоговых режимов",
    ],
  },
  {
    name: "С аккаунтом",
    price: "0 ₸",
    description: "Чтобы ничего не считать заново",
    cta: { label: "Создать аккаунт", href: "/register" },
    highlighted: true,
    features: [
      "Всё из тарифа «Без регистрации»",
      "Автосохранение и история всех расчётов",
      "АВР, счета, накладные, доверенности",
      "Учёт и ведомости по сотрудникам",
    ],
  },
];

export function LandingPricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">Тарифы</h2>
          <p className="mt-3 text-text-muted">Sana AI бесплатна — аккаунт просто открывает больше возможностей</p>
        </div>

        <div className="mx-auto mt-14 grid max-w-3xl gap-6 sm:grid-cols-2">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.highlighted
                  ? "relative rounded-2xl border-2 border-primary bg-white p-8 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  : "relative rounded-2xl border border-border bg-white p-8 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              }
            >
              {plan.highlighted ? (
                <span className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">
                  Рекомендуем
                </span>
              ) : null}

              <h3 className="text-lg font-semibold text-text">{plan.name}</h3>
              <p className="mt-1 text-sm text-text-muted">{plan.description}</p>
              <div className="mt-4 text-4xl font-bold text-text">{plan.price}</div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-text-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={
                  plan.highlighted
                    ? "mt-8 w-full bg-primary text-white hover:bg-primary-hover"
                    : "mt-8 w-full border-primary text-primary hover:bg-primary-bg"
                }
                variant={plan.highlighted ? "default" : "outline"}
              >
                <Link href={plan.cta.href}>{plan.cta.label}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
