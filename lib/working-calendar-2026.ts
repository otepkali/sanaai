/**
 * Норма рабочих дней/часов по месяцам 2026 года — 40-часовая рабочая неделя.
 * Источник: «Баланс рабочего времени на 2026 год», Министерство труда и социальной
 * защиты населения РК. Часы для шестидневки не делятся ровно на дни (короче
 * рабочий день перед выходным), поэтому хранятся как отдельное точное значение,
 * а не выводятся умножением дней на константу.
 */
export type WorkSchedule = "five_day" | "six_day";

export const WORK_SCHEDULES: { value: WorkSchedule; label: string }[] = [
  { value: "five_day", label: "Пятидневка" },
  { value: "six_day", label: "Шестидневка" },
];

interface MonthNorm {
  value: number;
  label: string;
  fiveDay: { days: number; hours: number };
  sixDay: { days: number; hours: number };
}

export const WORKING_CALENDAR_2026: MonthNorm[] = [
  { value: 1, label: "Январь 2026", fiveDay: { days: 19, hours: 152 }, sixDay: { days: 24, hours: 158 } },
  { value: 2, label: "Февраль 2026", fiveDay: { days: 20, hours: 160 }, sixDay: { days: 24, hours: 160 } },
  { value: 3, label: "Март 2026", fiveDay: { days: 18, hours: 144 }, sixDay: { days: 22, hours: 148 } },
  { value: 4, label: "Апрель 2026", fiveDay: { days: 22, hours: 176 }, sixDay: { days: 26, hours: 174 } },
  { value: 5, label: "Май 2026", fiveDay: { days: 17, hours: 136 }, sixDay: { days: 22, hours: 146 } },
  { value: 6, label: "Июнь 2026", fiveDay: { days: 22, hours: 176 }, sixDay: { days: 26, hours: 174 } },
  { value: 7, label: "Июль 2026", fiveDay: { days: 22, hours: 176 }, sixDay: { days: 26, hours: 174 } },
  { value: 8, label: "Август 2026", fiveDay: { days: 20, hours: 160 }, sixDay: { days: 25, hours: 165 } },
  { value: 9, label: "Сентябрь 2026", fiveDay: { days: 22, hours: 176 }, sixDay: { days: 26, hours: 174 } },
  { value: 10, label: "Октябрь 2026", fiveDay: { days: 21, hours: 168 }, sixDay: { days: 26, hours: 172 } },
  { value: 11, label: "Ноябрь 2026", fiveDay: { days: 21, hours: 168 }, sixDay: { days: 25, hours: 167 } },
  { value: 12, label: "Декабрь 2026", fiveDay: { days: 22, hours: 176 }, sixDay: { days: 26, hours: 174 } },
];

const FALLBACK_NORM = { days: 21, hours: 168 };

export function getWorkingNorm(month: number, schedule: WorkSchedule): { days: number; hours: number } {
  const entry = WORKING_CALENDAR_2026.find((m) => m.value === month);
  if (!entry) return FALLBACK_NORM;
  return schedule === "six_day" ? entry.sixDay : entry.fiveDay;
}
