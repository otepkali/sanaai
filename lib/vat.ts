import { TAX_2026 } from "./tax-config-2026";

/** "exclusive" — сумма без НДС, налог начисляется сверху; "inclusive" — сумма уже включает НДС */
export type VatMode = "exclusive" | "inclusive";

export interface VatInput {
  amount: number;
  mode: VatMode;
}

export interface VatResult {
  rate: number;
  mode: VatMode;
  /** Сумма без НДС */
  netAmount: number;
  /** Сумма НДС */
  vatAmount: number;
  /** Сумма с НДС */
  grossAmount: number;
}

export function calculateVat({ amount, mode }: VatInput): VatResult {
  const rate = TAX_2026.VAT_RATE;

  if (mode === "exclusive") {
    const netAmount = amount;
    const vatAmount = netAmount * rate;
    return { rate, mode, netAmount, vatAmount, grossAmount: netAmount + vatAmount };
  }

  const grossAmount = amount;
  const netAmount = grossAmount / (1 + rate);
  const vatAmount = grossAmount - netAmount;
  return { rate, mode, netAmount, vatAmount, grossAmount };
}

export interface VatThresholdResult {
  turnover: number;
  threshold: number;
  usageRatio: number;
  isRegistrationRequired: boolean;
}

export function checkVatRegistrationThreshold(turnover: number): VatThresholdResult {
  const threshold = TAX_2026.VAT_REGISTRATION_THRESHOLD_MRP * TAX_2026.MRP;
  return {
    turnover,
    threshold,
    usageRatio: threshold > 0 ? turnover / threshold : 0,
    isRegistrationRequired: turnover >= threshold,
  };
}

export interface VatSettlementInput {
  /** НДС, уплаченный поставщикам (к зачёту) */
  inputVat: number;
  /** НДС, начисленный покупателям с реализации */
  outputVat: number;
}

export interface VatSettlementResult {
  inputVat: number;
  outputVat: number;
  /** outputVat − inputVat: положительное — к уплате в бюджет, отрицательное — к возврату/зачёту */
  netVat: number;
  isRefund: boolean;
}

/** Зачёт «исходящего» НДС (с продаж) против «входящего» (с покупок) за период */
export function calculateVatSettlement({ inputVat, outputVat }: VatSettlementInput): VatSettlementResult {
  const netVat = outputVat - inputVat;
  return {
    inputVat,
    outputVat,
    netVat,
    isRefund: netVat < 0,
  };
}
