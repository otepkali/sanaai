import Image from "next/image";
import Link from "next/link";

const PRODUCT_LINKS = [
  { href: "/calculators", label: "Калькуляторы" },
  { href: "#features", label: "Возможности" },
  { href: "#pricing", label: "Тарифы" },
  { href: "#faq", label: "Вопросы" },
];

const ACCOUNT_LINKS = [
  { href: "/login", label: "Войти" },
  { href: "/register", label: "Создать аккаунт" },
  { href: "/documents", label: "Документы" },
  { href: "/accounting", label: "Учёт и ведомости" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="container grid gap-10 py-14 sm:grid-cols-3">
        <div>
          <Link href="/" className="inline-flex items-center" aria-label="Sana AI — на главную">
            <Image src="/logo.png" alt="Sana AI" width={390} height={146} className="h-11 w-auto" />
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-muted">
            Налоговый AI-ассистент для ИП и бухгалтеров Казахстана. Калькуляторы и документы по
            официальным формам РК на 2026 год.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-text">Продукт</h4>
          <ul className="mt-4 space-y-2.5">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="text-sm text-text-muted transition-colors hover:text-text">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-text">Аккаунт</h4>
          <ul className="mt-4 space-y-2.5">
            {ACCOUNT_LINKS.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="text-sm text-text-muted transition-colors hover:text-text">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container py-6 text-xs leading-relaxed text-text-muted">
          © {new Date().getFullYear()} Sana AI. Калькулятор носит справочный характер. Ставки актуальны
          на 2026 год. Для официальных расчётов сверяйтесь с Налоговым кодексом РК и консультируйтесь с
          бухгалтером.
        </div>
      </div>
    </footer>
  );
}
