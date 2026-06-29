import Image from "next/image";
import { Check, Sparkles } from "lucide-react";

const AUDIENCE = [
  {
    image: "/landing/accountant-male.png",
    alt: "Бухгалтер работает с расчётами в офисе",
    eyebrow: "Для бухгалтеров",
    title: "Сверяйте расчёты клиентов в одном окне",
    description:
      "ОПВ, ВОСМС, ИПН, СО и НДС — без ручных таблиц и формул. Готовые АВР, счета и накладные по формам РК.",
    points: ["Расчёт ФОТ и упрощёнки за секунды", "Документы по официальным формам РК", "История расчётов по каждому клиенту"],
    reverse: false,
  },
  {
    image: "/landing/business-owners.png",
    alt: "Руководители обсуждают показатели бизнеса",
    eyebrow: "Для владельцев бизнеса",
    title: "Понимайте свои налоги без звонка бухгалтеру",
    description:
      "Сколько реально уходит на налоги и сотрудников — за 30 секунд, с разбивкой каждой суммы и сравнением режимов.",
    points: ["Сравнение налоговых режимов", "Расчёт ФОТ на сотрудника и на всю ведомость", "Полная прозрачность каждой суммы"],
    reverse: true,
  },
];

export function LandingAudience() {
  return (
    <section className="py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">Кому подходит Sana AI</h2>
          <p className="mt-3 text-text-muted">Один инструмент — для тех, кто считает, и для тех, кто принимает решения</p>
        </div>

        <div className="mt-14 space-y-16">
          {AUDIENCE.map((item) => (
            <div
              key={item.title}
              className={`flex flex-col items-center gap-10 lg:flex-row ${item.reverse ? "lg:flex-row-reverse" : ""}`}
            >
              <div className="relative w-full max-w-md shrink-0 lg:w-1/2">
                <div className="relative aspect-[1343/800] overflow-hidden rounded-3xl border border-border shadow-soft">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(min-width: 1024px) 40vw, 90vw"
                    className="object-cover"
                  />
                </div>
                <span className="absolute -bottom-5 -right-5 hidden h-14 w-14 animate-float items-center justify-center rounded-2xl bg-white text-primary shadow-soft sm:flex">
                  <Sparkles className="h-6 w-6" />
                </span>
              </div>

              <div className="w-full lg:w-1/2">
                <span className="text-sm font-semibold text-primary">{item.eyebrow}</span>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-text">{item.title}</h3>
                <p className="mt-3 text-text-muted">{item.description}</p>
                <ul className="mt-5 space-y-2.5">
                  {item.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-text-muted">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
