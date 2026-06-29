import { Calculator, SlidersHorizontal, FileCheck2, ArrowRight } from "lucide-react";

const STEPS = [
  {
    icon: Calculator,
    title: "Выберите калькулятор",
    description: "ФОТ, упрощёнка (910), НДС или сравнение режимов — под любую задачу ИП.",
  },
  {
    icon: SlidersHorizontal,
    title: "Введите данные",
    description: "Оклад, доход или ставка налога. Расчёт обновляется мгновенно, без кнопки «Посчитать».",
  },
  {
    icon: FileCheck2,
    title: "Получите результат",
    description: "Подробная разбивка каждой суммы и готовый документ — АВР, счёт или накладная — в один клик.",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">Как это работает</h2>
          <p className="mt-3 text-text-muted">Три шага от пустого экрана до готового расчёта</p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="group relative rounded-2xl border border-border bg-white p-6 shadow-soft transition-shadow hover:shadow-lg"
            >
              {index < STEPS.length - 1 ? (
                <ArrowRight className="absolute -right-7 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 animate-pulse text-primary/40 sm:block" />
              ) : null}
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-bg text-primary transition-transform duration-300 group-hover:scale-110">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-primary">Шаг {index + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-text">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
