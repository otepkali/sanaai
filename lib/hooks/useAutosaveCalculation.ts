"use client";

import { useEffect, useRef } from "react";
import { formatDateLong } from "@/lib/format";
import { upsertCalculation, type CalculationType } from "@/lib/supabase/calculations";
import { useUser } from "./useUser";

const TYPE_LABELS: Record<CalculationType, string> = {
  fot: "ФОТ",
  simplified: "Упрощёнка",
  vat: "НДС",
  comparison: "Сравнение режимов",
};

function autoTitle(type: CalculationType): string {
  const todayIso = new Date().toISOString().slice(0, 10);
  const datePart = formatDateLong(todayIso).replace(/ г\.$/, "");
  return `${TYPE_LABELS[type]} — ${datePart}`;
}

/**
 * Автосохраняет текущий расчёт в Supabase через 1.5с после последнего изменения
 * input/result. Молча ничего не делает, если пользователь не авторизован.
 * `initialId` — id восстановленной из истории записи: дальнейшие сохранения
 * обновляют её, а не создают новую строку.
 */
export interface UseAutosaveCalculationOptions {
  /** id восстановленной из истории записи — дальнейшие сохранения обновляют её */
  initialId?: string;
  /** Вызывается после каждого успешного сохранения — сигнал для обновления истории */
  onSaved?: () => void;
}

export function useAutosaveCalculation(
  type: CalculationType,
  input: unknown,
  result: unknown,
  options?: UseAutosaveCalculationOptions
) {
  const { user } = useUser();
  const rowIdRef = useRef<string | null>(options?.initialId ?? null);
  const onSavedRef = useRef(options?.onSaved);

  useEffect(() => {
    onSavedRef.current = options?.onSaved;
  }, [options?.onSaved]);

  useEffect(() => {
    if (!user) return;

    const timeoutId = setTimeout(() => {
      upsertCalculation({
        id: rowIdRef.current,
        userId: user.id,
        type,
        title: autoTitle(type),
        input,
        result,
      })
        .then((id) => {
          if (id) rowIdRef.current = id;
          onSavedRef.current?.();
        })
        .catch((error) => {
          console.error("Не удалось сохранить расчёт", error);
        });
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [user, type, input, result]);
}
