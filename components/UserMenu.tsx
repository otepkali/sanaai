"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, CreditCard, FileText, LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function UserMenu({ email }: { email: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Только чтобы показать пункт меню — сам доступ к /admin проверяется на сервере.
    createClient()
      .rpc("is_admin")
      .then(({ data }) => setIsAdmin(data === true));
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-muted transition-colors hover:bg-surface-tint hover:text-text"
      >
        <span className="hidden sm:inline">{email}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 w-56 rounded-xl border border-border bg-white p-2 shadow-soft">
          <div className="border-b border-border px-3 py-2 text-xs text-text-muted sm:hidden">{email}</div>
          <Link
            href="/documents/requisites"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text transition-colors hover:bg-surface-tint"
          >
            <FileText className="h-4 w-4" />
            Мои реквизиты
          </Link>
          <Link
            href="/billing"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text transition-colors hover:bg-surface-tint"
          >
            <CreditCard className="h-4 w-4" />
            Подписка
          </Link>
          {isAdmin ? (
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text transition-colors hover:bg-surface-tint"
            >
              <ShieldCheck className="h-4 w-4" />
              Админка
            </Link>
          ) : null}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </div>
      ) : null}
    </div>
  );
}
