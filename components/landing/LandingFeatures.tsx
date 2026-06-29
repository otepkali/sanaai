import { Users, Receipt, Percent, FileText, Coins } from "lucide-react";

const FEATURES = [
  {
    icon: Users,
    title: "Калькулятор ФОТ",
    description:
      "ОПВ, ВОСМС, ИПН, СО и ООСМС с разбивкой по каждому сотруднику. Один сотрудник или вся ведомость сразу.",
    tag: "Бесплатно",
  },
  {
    icon: Percent,
    title: "Упрощённая декларация 910",
    description: "Расчёт налога по полугодиям, льготная ставка для квалифицированных сотрудников, сроки сдачи.",
    tag: "Бесплатно",
  },
  {
    icon: Receipt,
    title: "НДС: прямой и обратный расчёт",
    description: "Ставка 16% на 2026 год — выделение НДС из суммы или начисление сверху, без ручных формул.",
    tag: "Бесплатно",
  },
  {
    icon: FileText,
    title: "Документы и история расчётов",
    description: "АВР, счета, накладные, доверенности по формам РК — с автосохранением и историей в личном кабинете.",
    tag: "С аккаунтом",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="relative overflow-hidden bg-surface-tint py-24">
      <span className="absolute right-[6%] top-12 hidden h-16 w-16 animate-float items-center justify-center rounded-2xl bg-white text-primary shadow-soft lg:flex">
        <Coins className="h-7 w-7" />
      </span>

      <div className="container relative">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">Возможности</h2>
          <p className="mt-3 text-text-muted">Всё, что нужно ИП и бухгалтеру для расчётов и документов</p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-bg text-primary transition-transform duration-300 group-hover:scale-110">
                  <feature.icon className="h-5 w-5" />
                </span>
                <span
                  className={
                    feature.tag === "Бесплатно"
                      ? "rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success"
                      : "rounded-full bg-primary-bg px-3 py-1 text-xs font-medium text-primary"
                  }
                >
                  {feature.tag}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-text">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
