/**
 * Норма рабочих дней по месяцам 2026 года — 40-часовая рабочая неделя, пятидневка.
 * Источник: «Баланс рабочего времени на 2026 год», Министерство труда и социальной
 * защиты населения РК.
 */
export const WORKING_DAYS_2026 = [
  { value: 1, label: "Январь 2026", days: 19 },
  { value: 2, label: "Февраль 2026", days: 20 },
  { value: 3, label: "Март 2026", days: 18 },
  { value: 4, label: "Апрель 2026", days: 22 },
  { value: 5, label: "Май 2026", days: 17 },
  { value: 6, label: "Июнь 2026", days: 22 },
  { value: 7, label: "Июль 2026", days: 22 },
  { value: 8, label: "Август 2026", days: 20 },
  { value: 9, label: "Сентябрь 2026", days: 22 },
  { value: 10, label: "Октябрь 2026", days: 21 },
  { value: 11, label: "Ноябрь 2026", days: 21 },
  { value: 12, label: "Декабрь 2026", days: 22 },
] as const;

export function getWorkingDaysNorm(month: number): number {
  return WORKING_DAYS_2026.find((m) => m.value === month)?.days ?? 21;
}
