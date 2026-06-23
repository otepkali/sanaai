import { numberToWordsRu } from "@/lib/number-to-words";
import { formatDecimal } from "@/lib/format";
import type { InvoiceData, InvoiceItem, VatMode } from "./types";

const VAT_RATE = 0.16;
const IPN_RATE = 0.1;

/** Форматирует сумму в стиле 1С: 333 920,00 (неразрывный пробел в тысячах, запятая для копеек) */
export function formatMoney(value: number): string {
  return formatDecimal(value, 2);
}

/**
 * Сумма прописью в тенге/тиын для официальных документов КЗ — в отличие от
 * lib/number-to-words.ts, тиын здесь намеренно не склоняется (всегда "тиын"),
 * как в реальных бланках 1С, а не по правилам русской грамматики.
 */
export function numberToWordsKZT(amount: number): string {
  const safeAmount = Math.max(0, amount);
  const tenge = Math.floor(safeAmount);
  const tiyn = Math.round((safeAmount - tenge) * 100);

  const tengeWords = numberToWordsRu(tenge);
  const capitalized = tengeWords.charAt(0).toUpperCase() + tengeWords.slice(1);

  return `${capitalized} тенге ${String(tiyn).padStart(2, "0")} тиын`;
}

export interface InvoiceLineResult extends InvoiceItem {
  lineTotal: number;
}

export interface InvoiceCalcResult {
  lines: InvoiceLineResult[];
  /** Сумма строк как введено (qty × price) — то, что показывается в строке «Итого:» */
  subtotal: number;
  /** Сумма без НДС */
  netAmount: number;
  /** НДС — null, если не плательщик НДС */
  vatAmount: number | null;
  /** Итого к оплате с учётом НДС — основа для суммы прописью и имени файла */
  grossAmount: number;
  /** Режим трактовки НДС — определяет подпись («В том числе» / «Кроме того») */
  vatMode: VatMode;
  itemsCount: number;
  amountInWords: string;
  taxableIncome: number;
  /** ИПН 10% от налогооблагаемого дохода — null, если налоговый блок не показывается */
  ipnAmount: number | null;
}

/** Никогда не доверяй суммам с клиента — это единственное место, где считаются итоги счёта */
export function calculateInvoiceTotals(data: InvoiceData): InvoiceCalcResult {
  const lines: InvoiceLineResult[] = data.items.map((item) => ({
    ...item,
    lineTotal: item.qty * item.price,
  }));
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  let netAmount: number;
  let vatAmount: number | null;
  let grossAmount: number;

  if (!data.isVatPayer) {
    netAmount = subtotal;
    vatAmount = null;
    grossAmount = subtotal;
  } else if (data.vatMode === "exclusive") {
    // Цены без НДС — налог начисляется сверх суммы строк
    netAmount = subtotal;
    vatAmount = subtotal * VAT_RATE;
    grossAmount = subtotal + vatAmount;
  } else {
    // Цены уже включают НДС — он выделяется из суммы строк (16/116)
    grossAmount = subtotal;
    vatAmount = (subtotal * VAT_RATE) / (1 + VAT_RATE);
    netAmount = subtotal - vatAmount;
  }

  const taxableIncome = data.taxableIncome ?? 0;
  const ipnAmount = data.showTaxBlock ? IPN_RATE * taxableIncome : null;

  return {
    lines,
    subtotal,
    netAmount,
    vatAmount,
    grossAmount,
    vatMode: data.vatMode,
    itemsCount: data.items.length,
    amountInWords: numberToWordsKZT(grossAmount),
    taxableIncome,
    ipnAmount,
  };
}

export { VAT_RATE, IPN_RATE };
