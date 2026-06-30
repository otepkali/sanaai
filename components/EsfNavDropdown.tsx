"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export function EsfNavDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-surface-tint hover:text-text"
      >
        ЭСФ
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-full z-50 w-48 rounded-xl border border-border bg-white p-2 shadow-soft">
          <Link
            href="/esf"
            onClick={() => setIsOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm text-text transition-colors hover:bg-surface-tint"
          >
            Выписать ЭСФ
          </Link>
          <Link
            href="/esf/history"
            onClick={() => setIsOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm text-text transition-colors hover:bg-surface-tint"
          >
            История ЭСФ
          </Link>
        </div>
      ) : null}
    </div>
  );
}
