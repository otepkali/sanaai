import { TAX_2026 } from "./tax-config-2026";

export interface CompareInput {
  /** Годовой оборот (доход), тенге */
  annualRevenue: number;
  /** Примерные годовые расходы, без учёта ФОТ, тенге */
  annualExpenses: number;
  /** Годовой ФОТ работников, тенге */
  annualPayroll: number;
}

export interface CompareResult {
  annualRevenue: number;
  simplifiedTax: number;
  simplifiedRate: number;
  simplifiedBurdenRatio: number;
  isOverSimplifiedLimit: boolean;
  simplifiedLimit: number;

  generalProfit: number;
  generalIpn: number;
  generalSocialTax: number;
  generalTax: number;
  generalBurdenRatio: number;

  cheaperRegime: "simplified" | "general" | "equal";
  savingsAmount: number;
}

export function compareTaxRegimes(input: CompareInput): CompareResult {
  const { annualRevenue, annualExpenses, annualPayroll } = input;

  const simplifiedRate = TAX_2026.SIMPLIFIED_RATE_DEFAULT;
  const simplifiedTax = simplifiedRate * annualRevenue;
  const simplifiedLimit = TAX_2026.SIMPLIFIED_INCOME_LIMIT_MRP * TAX_2026.MRP;
  const isOverSimplifiedLimit = annualRevenue > simplifiedLimit;

  // Общий режим (ОУР): ИПН 10% облагает прибыль (доход за вычетом расходов и ФОТ),
  // ФОТ дополнительно облагается социальным налогом — в отличие от упрощёнки, где
  // и НДС, и соцналог для ИП не уплачиваются вовсе.
  const generalProfit = Math.max(0, annualRevenue - annualExpenses - annualPayroll);
  const generalIpn = TAX_2026.IPN * generalProfit;
  const generalSocialTax = TAX_2026.SN * annualPayroll;
  const generalTax = generalIpn + generalSocialTax;

  const burdenRatio = (tax: number) => (annualRevenue > 0 ? tax / annualRevenue : 0);

  // Если оборот превышает лимит упрощёнки, она недоступна как вариант —
  // независимо от того, что формально насчитанный налог по ней меньше.
  const cheaperRegime: CompareResult["cheaperRegime"] = isOverSimplifiedLimit
    ? "general"
    : simplifiedTax === generalTax
      ? "equal"
      : simplifiedTax < generalTax
        ? "simplified"
        : "general";

  return {
    annualRevenue,
    simplifiedTax,
    simplifiedRate,
    simplifiedBurdenRatio: burdenRatio(simplifiedTax),
    isOverSimplifiedLimit,
    simplifiedLimit,

    generalProfit,
    generalIpn,
    generalSocialTax,
    generalTax,
    generalBurdenRatio: burdenRatio(generalTax),

    cheaperRegime,
    savingsAmount: Math.abs(simplifiedTax - generalTax),
  };
}
