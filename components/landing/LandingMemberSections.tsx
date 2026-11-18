import Link from "next/link";
import { ArrowRight, Calculator, CreditCard, FileText, Building2 } from "lucide-react";

const SECTIONS = [
  {
    href: "/calculators",
    icon: Calculator,
    title: "Калькуляторы",
    description: "ФОТ, упрощёнка 910, НДС и сравнение режимов",
  },
  {
    href: "/documents",
    icon: FileText,
    title: "Документы",
    description: "Счета, АВР, доверенности, накладные, ведомости",
  },
  {
    href: "/documents/requisites",
    icon: Building2,
    title: "Мои реквизиты",
    description: "Данные компании для автоподстановки",
  },
  {
    href: "/billing",
    icon: CreditCard,
    title: "Подписка",
    description: "Статус, дата следующего списания, отмена",
  },
];

/** Быстрый доступ к разделам — показывается на главной только пользователям с активной подпиской */
export function LandingMemberSections() {
  return (
    <section className="border-b border-border bg-background py-10">
      <div className="container">
        <h2 className="text-xl font-semibold text-text">Ваши разделы</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map(({ href, icon: Icon, title, description }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col rounded-2xl border border-border bg-white p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-bg text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <span className="mt-4 flex items-center gap-1 font-semibold text-text">
                {title}
                <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </span>
              <span className="mt-1 text-sm text-text-muted">{description}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
