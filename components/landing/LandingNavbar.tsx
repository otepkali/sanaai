"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "#features", label: "Возможности" },
  { href: "#pricing", label: "Тарифы" },
  { href: "#faq", label: "Вопросы" },
];

export function LandingNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/90 backdrop-blur-sm">
      <div className="container flex items-center justify-between py-4">
        <Link href="/" className="flex items-center" aria-label="Sana AI — на главную">
          <Image src="/logo.png" alt="Sana AI" width={390} height={146} className="h-12 w-auto" priority />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-text-muted transition-colors hover:text-text"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary-bg">
            <Link href="/login">Войти</Link>
          </Button>
          <Button asChild className="bg-primary text-white hover:bg-primary-hover">
            <Link href="/register">Начать бесплатно</Link>
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-text md:hidden"
          aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isMenuOpen ? (
        <div className="border-t border-border bg-white md:hidden">
          <nav className="container flex flex-col gap-1 py-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm text-text-muted hover:bg-surface-tint hover:text-text"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 px-3">
              <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary-bg">
                <Link href="/login">Войти</Link>
              </Button>
              <Button asChild className="bg-primary text-white hover:bg-primary-hover">
                <Link href="/register">Начать бесплатно</Link>
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
