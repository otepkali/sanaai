"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "Нужна ли регистрация, чтобы посчитать налоги?",
    answer:
      "Нет. Калькуляторы ФОТ, упрощённой декларации, НДС и сравнения режимов открыты всем без регистрации и входа в аккаунт.",
  },
  {
    question: "Для чего тогда нужен аккаунт?",
    answer:
      "Аккаунт сохраняет историю ваших расчётов и открывает раздел документов — АВР, счета, накладные, доверенности — а также учёт и ведомости по сотрудникам.",
  },
  {
    question: "Расчёты актуальны на 2026 год?",
    answer:
      "Да, все ставки (ОПВ, ВОСМС, ИПН, СО, НДС 16%) соответствуют налоговому законодательству Казахстана на 2026 год.",
  },
  {
    question: "Можно ли скачать готовый документ?",
    answer:
      "Да. АВР, счета на оплату, накладные и доверенности формируются по официальным формам РК и сразу доступны для скачивания в PDF.",
  },
  {
    question: "Sana AI заменяет бухгалтера?",
    answer:
      "Sana AI берёт на себя расчёты и рутинные документы, но окончательные решения и сдачу отчётности мы рекомендуем сверять с бухгалтером или налоговым консультантом.",
  },
];

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-surface-tint py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">Частые вопросы</h2>
          <p className="mt-3 text-text-muted">Не нашли ответ — напишите нам, поможем</p>
        </div>

        <div className="mx-auto mt-12 max-w-2xl space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.question} className="overflow-hidden rounded-xl border border-border bg-white">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-medium text-text sm:text-base">{item.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-text-muted transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-200 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm leading-relaxed text-text-muted">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
