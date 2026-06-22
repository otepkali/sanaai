const GROUP_FORMATTER = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0,
});

/** Форматирует сумму с разделителями тысяч и символом тенге, например 1 234 567 ₸ */
export function formatTenge(value: number): string {
  return `${GROUP_FORMATTER.format(Math.round(value))} ₸`;
}

/** Форматирует число с разделителями тысяч, без символа валюты */
export function formatNumber(value: number): string {
  return GROUP_FORMATTER.format(Math.round(value));
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${(value * 100).toFixed(fractionDigits).replace(/\.0+$/, "")}%`;
}

/** Форматирует число с заданной точностью в стиле ru-RU (запятая как разделитель дробной части), например 96840 → "96 840,00" */
export function formatDecimal(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

/** Форматирует дату ISO ("2026-06-22") в виде "22 июня 2026 г." для официальных документов */
export function formatDateLong(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return "—";
  return `${day} ${MONTHS_GENITIVE[month - 1]} ${year} г.`;
}

/** Извлекает число из произвольно отформатированной строки ввода ("300 000" → 300000) */
export function parseAmountInput(raw: string): number {
  const digitsOnly = raw.replace(/[^\d]/g, "");
  if (!digitsOnly) return 0;
  return Number(digitsOnly);
}

/** Форматирует число для отображения в маскированном поле ввода (без символа ₸) */
export function formatAmountInput(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "";
  return GROUP_FORMATTER.format(value);
}
