import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/UserMenu";

export function AppHeader({ userEmail, children }: { userEmail: string; children: ReactNode }) {
  return (
    <header className="border-b border-border bg-gradient-to-b from-white to-surface-tint">
      <div className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Sana Ai" width={160} height={60} className="h-9 w-auto" priority />
          <span className="hidden border-l border-border pl-3 text-sm text-text-muted sm:block">
            Налоговый калькулятор РК
          </span>
          <nav className="hidden items-center gap-1 border-l border-border pl-3 md:flex">
            <Link
              href="/calculators"
              className="rounded-md px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-surface-tint hover:text-text"
            >
              Калькуляторы
            </Link>
            <Link
              href="/accounting"
              className="rounded-md px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-surface-tint hover:text-text"
            >
              Учёт и ведомости
            </Link>
            <Link
              href="/documents"
              className="rounded-md px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-surface-tint hover:text-text"
            >
              Документы
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {userEmail ? <UserMenu email={userEmail} /> : null}
          <ThemeToggle />
        </div>
      </div>
      <div className="container pb-12 pt-4">{children}</div>
    </header>
  );
}
