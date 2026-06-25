import { TAX_2026, type BenefitCategory } from "./tax-config-2026";

export type PayrollMode = "too_our" | "ip";

export interface PayrollInput {
  /** Начисленный оклад («грязными»), тенге/мес */
  grossSalary: number;
  mode?: PayrollMode;
  /** Применять ли стандартный вычет 30 МРП */
  applyStandardDeduction?: boolean;
  benefitCategory?: BenefitCategory;
  /** Лица, рождённые до 01.01.1975, освобождены от ОПВР */
  bornBeforeJan1975?: boolean;
  /**
   * Совокупный годовой доход для проверки порога прогрессивной ставки ИПН
   * (8 500 МРП). По умолчанию — оклад × 12.
   */
  annualIncome?: number;
}

export interface PayrollResult {
  grossSalary: number;
  mode: PayrollMode;
  benefitCategory: BenefitCategory;

  // Удержания с работника
  opv: number;
  vosms: number;
  standardDeduction: number;
  disabilityDeductionMonthly: number;
  ipnBase: number;
  ipnRate: number;
  ipn: number;
  /** Сумма «на руки» */
  netIncome: number;

  // За счёт работодателя, сверх оклада
  so: number;
  oosms: number;
  opvr: number;
  sn: number;
  /** СН до зачёта СО (ст. 484 НК РК) — отдельная полная сумма, как в ведомостях 1С */
  snGross: number;
  /** Полная стоимость работника для работодателя */
  employerCost: number;

  isProgressiveIpn: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function calculatePayroll(input: PayrollInput): PayrollResult {
  const {
    grossSalary,
    mode = "too_our",
    applyStandardDeduction = true,
    benefitCategory = "none",
    bornBeforeJan1975 = false,
    annualIncome,
  } = input;

  // Пенсионеры освобождены от ОПВ, ВОСМС и СО.
  const exemptFromPensionAndSocial = benefitCategory === "pensioner";
  // Студенты-очники и пенсионеры не платят взносы на медстрахование (ВОСМС/ООСМС).
  const exemptFromMedical = benefitCategory === "pensioner" || benefitCategory === "student";
  const isDisabled = benefitCategory === "disabled";

  // 1. ОПВ = 10% × min(оклад, 50 × МЗП)
  const opv = exemptFromPensionAndSocial
    ? 0
    : TAX_2026.OPV * Math.min(grossSalary, TAX_2026.OPV_CEILING_MZP * TAX_2026.MZP);

  // 2. ВОСМС = 2% × min(оклад, 20 × МЗП)
  const vosms = exemptFromMedical
    ? 0
    : TAX_2026.VOSMS * Math.min(grossSalary, TAX_2026.VOSMS_CEILING_MZP * TAX_2026.MZP);

  const standardDeduction = applyStandardDeduction
    ? TAX_2026.STANDARD_DEDUCTION_MRP * TAX_2026.MRP
    : 0;

  // Доп. вычет 882 МРП/год для инвалидов I-III групп пересчитан в месячный.
  const disabilityDeductionMonthly = isDisabled
    ? (TAX_2026.DISABILITY_DEDUCTION_MRP * TAX_2026.MRP) / 12
    : 0;

  // 3. База ИПН = max(0, оклад − ОПВ − ВОСМС − вычеты)
  const ipnBase = Math.max(
    0,
    grossSalary - opv - vosms - standardDeduction - disabilityDeductionMonthly
  );

  const effectiveAnnualIncome = annualIncome ?? grossSalary * 12;
  const isProgressiveIpn =
    effectiveAnnualIncome > TAX_2026.IPN_PROGRESSIVE_THRESHOLD_MRP * TAX_2026.MRP;
  const ipnRate = isProgressiveIpn ? TAX_2026.IPN_PROGRESSIVE : TAX_2026.IPN;

  // 4. ИПН
  const ipn = ipnRate * ipnBase;

  // 5. На руки = оклад − ОПВ − ВОСМС − ИПН
  const netIncome = grossSalary - opv - vosms - ipn;

  // 6. СО = 5% × clamp(оклад − ОПВ, 1×МЗП, 7×МЗП)
  const so = exemptFromPensionAndSocial
    ? 0
    : TAX_2026.SO *
      clamp(
        grossSalary - opv,
        TAX_2026.SO_FLOOR_MZP * TAX_2026.MZP,
        TAX_2026.SO_CEILING_MZP * TAX_2026.MZP
      );

  // 7. ООСМС = 3% × min(оклад, 40 × МЗП)
  const oosms = exemptFromMedical
    ? 0
    : TAX_2026.OOSMS * Math.min(grossSalary, TAX_2026.OOSMS_CEILING_MZP * TAX_2026.MZP);

  // 8. ОПВР = 3,5% × оклад (не начисляется для рождённых до 01.01.1975)
  const opvr = bornBeforeJan1975 ? 0 : TAX_2026.OPVR * grossSalary;

  // 9. СН (полная сумма, до зачёта) = 6% × (оклад − ОПВ − ВОСМС)
  const snGross = TAX_2026.SN * Math.max(0, grossSalary - opv - vosms);
  // 9b. СН к уплате = max(0, СН полная − СО) — зачёт по ст. 484 НК РК
  const sn = Math.max(0, snGross - so);

  // 10. Полная стоимость для работодателя
  const employerCost = grossSalary + so + oosms + opvr + sn;

  return {
    grossSalary,
    mode,
    benefitCategory,
    opv,
    vosms,
    standardDeduction,
    disabilityDeductionMonthly,
    ipnBase,
    ipnRate,
    ipn,
    netIncome,
    so,
    oosms,
    opvr,
    sn,
    snGross,
    employerCost,
    isProgressiveIpn,
  };
}

export type SolveGrossFromNetOptions = Omit<PayrollInput, "grossSalary">;

/**
 * Обратный расчёт: подбирает оклад («грязными»), при котором «на руки»
 * получится targetNet. calculatePayroll монотонна по окладу (чистый доход
 * растёт с окладом даже с учётом потолков ОПВ/ВОСМС и прогрессивной ставки
 * ИПН), поэтому решаем бинарным поиском, а не точной формулой.
 */
export function solveGrossFromNet(targetNet: number, options: SolveGrossFromNetOptions = {}): number {
  if (targetNet <= 0) return 0;

  let low = 0;
  let high = Math.max(targetNet * 1.6, 100_000);
  while (
    calculatePayroll({ grossSalary: high, ...options }).netIncome < targetNet &&
    high < 1_000_000_000
  ) {
    high *= 2;
  }

  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const net = calculatePayroll({ grossSalary: mid, ...options }).netIncome;
    if (net < targetNet) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return Math.round(high);
}

export const HOURS_PER_DAY_NORM = 8;
export const OVERTIME_RATE_MULTIPLIER = 1.5;

export interface ProrateWithOvertimeInput {
  /** Оклад (тариф) за полный месяц, тенге */
  grossSalary: number;
  /** Норма рабочих дней в месяце по балансу рабочего времени */
  normDays: number;
  /**
   * Норма рабочих часов в месяце. Указывается явно, а не выводится как
   * normDays × 8 — у шестидневки часы не делятся ровно на дни (короче
   * рабочий день перед выходным).
   */
  normHours: number;
  /** Фактически отработано дней */
  daysWorked: number;
  /** Фактически отработано часов */
  hoursWorked: number;
}

export interface ProrateWithOvertimeResult {
  /** Итоговая начисленная сумма с учётом переработки */
  accrued: number;
  /** Доплата за дни сверх нормы (в полуторном размере) */
  overtimeDaysPay: number;
  /** Доплата за часы сверх нормы (в полуторном размере) */
  overtimeHoursPay: number;
  dailyRate: number;
  hourlyRate: number;
}

/**
 * Пропорциональный пересчёт оклада по факту отработанных дней. Если дней или
 * часов отработано БОЛЬШЕ нормы — оклад за норму выплачивается полностью, а
 * превышение (по дням и отдельно по часам) оплачивается по ставке ×1,5,
 * как при сверхурочной работе (ст. 88 Трудового кодекса РК).
 */
export function prorateSalaryWithOvertime(input: ProrateWithOvertimeInput): ProrateWithOvertimeResult {
  const { grossSalary, normDays, normHours, daysWorked, hoursWorked } = input;

  if (normDays <= 0 || normHours <= 0) {
    return { accrued: Math.round(grossSalary), overtimeDaysPay: 0, overtimeHoursPay: 0, dailyRate: 0, hourlyRate: 0 };
  }

  const dailyRate = grossSalary / normDays;
  const hourlyRate = grossSalary / normHours;

  let baseAccrued: number;
  let overtimeDaysPay = 0;
  if (daysWorked > normDays) {
    overtimeDaysPay = (daysWorked - normDays) * dailyRate * OVERTIME_RATE_MULTIPLIER;
    baseAccrued = grossSalary + overtimeDaysPay;
  } else {
    baseAccrued = grossSalary * (daysWorked / normDays);
  }

  let overtimeHoursPay = 0;
  if (hoursWorked > normHours) {
    overtimeHoursPay = (hoursWorked - normHours) * hourlyRate * OVERTIME_RATE_MULTIPLIER;
  }

  return {
    accrued: Math.round(baseAccrued + overtimeHoursPay),
    overtimeDaysPay: Math.round(overtimeDaysPay),
    overtimeHoursPay: Math.round(overtimeHoursPay),
    dailyRate,
    hourlyRate,
  };
}

export interface GphInput {
  /** Сумма вознаграждения по договору ГПХ, тенге */
  amount: number;
}

export interface GphResult {
  amount: number;
  opv: number;
  vosms: number;
  ipnBase: number;
  ipn: number;
  /** Сумма «на руки» исполнителю */
  netIncome: number;
  /** Стоимость для заказчика — по ГПХ нет работодательских начислений (СО/СН/ООСМС/ОПВР) */
  customerCost: number;
}

/**
 * Договор ГПХ (гражданско-правового характера): ИПН 10%, ОПВ 10%, ВОСМС 2% —
 * в отличие от трудового договора, СО, СН, ООСМС и ОПВР по нему не начисляются.
 */
export function calculateGph(input: GphInput): GphResult {
  const { amount } = input;

  const opv = TAX_2026.OPV * Math.min(amount, TAX_2026.OPV_CEILING_MZP * TAX_2026.MZP);
  const vosms = TAX_2026.VOSMS * Math.min(amount, TAX_2026.VOSMS_CEILING_MZP * TAX_2026.MZP);
  const ipnBase = Math.max(0, amount - opv - vosms);
  const ipn = TAX_2026.IPN * ipnBase;
  const netIncome = amount - opv - vosms - ipn;

  return {
    amount,
    opv,
    vosms,
    ipnBase,
    ipn,
    netIncome,
    customerCost: amount,
  };
}
