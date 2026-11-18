"use client";

import { useCallback } from "react";
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

export interface UseSaveCalculationOptions {
  /** Вызывается после успешного сохранения — сигнал для обновления истории */
  onSaved?: () => void;
}

/**
 * Возвращает функцию, которая сохраняет текущий расчёт в историю пользователя.
 * Вызывается только после скачивания PDF — никакого автосохранения.
 * Молча ничего не делает, если пользователь не авторизован.
 */
export function useSaveCalculation(
  type: CalculationType,
  input: unknown,
  result: unknown,
  options?: UseSaveCalculationOptions
) {
  const { user } = useUser();
  const onSaved = options?.onSaved;

  return useCallback(async () => {
    if (!user) return;
    try {
      await upsertCalculation({
        id: null,
        userId: user.id,
        type,
        title: autoTitle(type),
        input,
        result,
      });
      onSaved?.();
    } catch (error) {
      console.error("Не удалось сохранить расчёт", error);
    }
  }, [user, type, input, result, onSaved]);
}
