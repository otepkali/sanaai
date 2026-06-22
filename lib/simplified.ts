import { TAX_2026, SIMPLIFIED_REGIONS, type SimplifiedRegionId } from "./tax-config-2026";

export interface SimplifiedInput {
  /** Доход за полугодие (за отчётный период декларации 910), тенге */
  halfYearIncome: number;
  regionId?: SimplifiedRegionId;
  /** Количество работников */
  employeeCount?: number;
  /** Суммарный ФОТ работников за то же полугодие, тенге */
  employeesHalfYearPayroll?: number;
}

export interface SimplifiedResult {
  halfYearIncome: number;
  rate: number;
  taxBeforeDiscount: number;
  averageMonthlyEmployeeSalary: number;
  isEmployeeDiscountEligible: boolean;
  qualifyingEmployees: number;
  discountRate: number;
  discountAmount: number;
  tax: number;
  annualIncomeEstimate: number;
  annualLimit: number;
  limitUsageRatio: number;
}

function getRegionRate(regionId?: SimplifiedRegionId): number {
  const region = SIMPLIFIED_REGIONS.find((r) => r.id === regionId);
  return region?.rate ?? TAX_2026.SIMPLIFIED_RATE_DEFAULT;
}

export function calculateSimplifiedTax(input: SimplifiedInput): SimplifiedResult {
  const {
    halfYearIncome,
    regionId,
    employeeCount = 0,
    employeesHalfYearPayroll = 0,
  } = input;

  const rate = getRegionRate(regionId);
  const taxBeforeDiscount = rate * halfYearIncome;

  // Полугодие = 6 месяцев — приводим ФОТ работников к средней зарплате на одного.
  const averageMonthlyEmployeeSalary =
    employeeCount > 0 ? employeesHalfYearPayroll / employeeCount / 6 : 0;

  const minQualifyingSalary = TAX_2026.SIMPLIFIED_EMPLOYEE_MIN_SALARY_MRP * TAX_2026.MRP;
  const isEmployeeDiscountEligible =
    employeeCount > 0 && averageMonthlyEmployeeSalary >= minQualifyingSalary;
  const qualifyingEmployees = isEmployeeDiscountEligible ? employeeCount : 0;

  const discountRate = TAX_2026.SIMPLIFIED_EMPLOYEE_DISCOUNT_RATE * qualifyingEmployees;
  const discountAmount = Math.min(taxBeforeDiscount, discountRate * halfYearIncome);

  const tax = Math.max(0, taxBeforeDiscount - discountAmount);

  // Декларация подаётся за полугодие — для проверки годового лимита доход экстраполируется ×2.
  const annualIncomeEstimate = halfYearIncome * 2;
  const annualLimit = TAX_2026.SIMPLIFIED_INCOME_LIMIT_MRP * TAX_2026.MRP;
  const limitUsageRatio = annualLimit > 0 ? annualIncomeEstimate / annualLimit : 0;

  return {
    halfYearIncome,
    rate,
    taxBeforeDiscount,
    averageMonthlyEmployeeSalary,
    isEmployeeDiscountEligible,
    qualifyingEmployees,
    discountRate,
    discountAmount,
    tax,
    annualIncomeEstimate,
    annualLimit,
    limitUsageRatio,
  };
}
