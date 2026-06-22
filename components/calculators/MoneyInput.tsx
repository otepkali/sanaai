"use client";

import { useId, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatAmountInput, parseAmountInput } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MoneyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  suffix?: string;
  error?: string;
  className?: string;
}

export function MoneyInput({
  label,
  value,
  onChange,
  hint,
  suffix = "₸",
  error,
  className,
}: MoneyInputProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const numeric = parseAmountInput(e.target.value);
    onChange(numeric);

    const input = inputRef.current;
    if (input) {
      requestAnimationFrame(() => {
        const end = input.value.length;
        input.setSelectionRange(end, end);
      });
    }
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-sm text-text-muted">
        {label}
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          inputMode="numeric"
          autoComplete="off"
          value={formatAmountInput(value)}
          onChange={handleChange}
          placeholder="0"
          className={cn(
            "font-tabular pr-10 text-base",
            error && "border-danger focus-visible:ring-danger"
          )}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-text-muted">
          {suffix}
        </span>
      </div>
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
