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
