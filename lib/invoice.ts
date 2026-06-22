import { TAX_2026 } from "./tax-config-2026";
import { calculateVat, type VatMode } from "./vat";
import { tengeAmountToWords } from "./number-to-words";

/** ТОО на ОУР платит КПН 20%, ИП на ОУР платит ИПН 10% — оба от прибыли, а не от оборота */
export type InvoiceEntityType = "too" | "ip";

export interface InvoiceLineItem {
  /** Код/артикул товара — необязателен, чисто справочный */
  code?: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceInput {
  items: InvoiceLineItem[];
  isVatPayer: boolean;
  vatMode: VatMode;
  entityType: InvoiceEntityType;
  /** Доля расходов по сделке, 0–100% */
  expenseSharePercent: number;
}

export interface InvoiceLineItemResult extends InvoiceLineItem {
  lineTotal: number;
}

export interface InvoiceResult {
  lines: InvoiceLineItemResult[];
  /** Сумма всех строк по введённым ценам — до интерпретации НДС */
  subtotal: number;
  vatRate: number;
  /** Сумма без НДС */
  netAmount: number;
  vatAmount: number;
  /** Итого к оплате */
  grossAmount: number;
  amountInWords: string;

  entityType: InvoiceEntityType;
  /** 0.2 для ТОО (КПН), 0.1 для ИП (ИПН) */
  profitTaxRate: number;
  expenseSharePercent: number;
  /** Налогооблагаемый доход = сумма без НДС за вычетом доли расходов */
  taxableProfit: number;
  profitTax: number;
}

export function calculateInvoice(input: InvoiceInput): InvoiceResult {
  const lines: InvoiceLineItemResult[] = input.items.map((item) => ({
    ...item,
    lineTotal: item.quantity * item.unitPrice,
  }));
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  const vat = input.isVatPayer
    ? calculateVat({ amount: subtotal, mode: input.vatMode })
    : { rate: 0, netAmount: subtotal, vatAmount: 0, grossAmount: subtotal };

  const profitTaxRate = input.entityType === "too" ? TAX_2026.KPN : TAX_2026.IPN;
  const expenseSharePercent = Math.min(100, Math.max(0, input.expenseSharePercent));
  const taxableProfit = vat.netAmount * (1 - expenseSharePercent / 100);
  const profitTax = profitTaxRate * taxableProfit;

  return {
    lines,
    subtotal,
    vatRate: vat.rate,
    netAmount: vat.netAmount,
    vatAmount: vat.vatAmount,
    grossAmount: vat.grossAmount,
    amountInWords: tengeAmountToWords(vat.grossAmount),

    entityType: input.entityType,
    profitTaxRate,
    expenseSharePercent,
    taxableProfit,
    profitTax,
  };
}
