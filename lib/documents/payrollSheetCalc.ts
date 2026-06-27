import { calculatePayroll } from "@/lib/payroll";
import type { PayrollSheetEmployee } from "./types";

export interface PayrollSheetEmployeeResult {
  employee: PayrollSheetEmployee;
  accrued: number;
  totalAccrued: number;
  ipnBase: number;
  ipn: number;
  opv: number;
  vosms: number;
  totalWithheld: number;
  totalToPay: number;
}

/**
 * Расчёт по сотруднику для формы Т-1 через ту же calculatePayroll(), что и в
 * калькуляторе ФОТ — ОПВ 10%, ИПН 10% от облагаемого дохода (с вычетом 30 МРП),
 * ВОСМС 2%. В официальной форме Т-1 (1962 года) нет отдельной колонки под
 * ВОСМС — он включается в колонку «прочие» удержания (40-41).
 */
export function calculatePayrollSheetEmployee(employee: PayrollSheetEmployee): PayrollSheetEmployeeResult {
  const accrued = employee.tariffRate;
  const result = calculatePayroll({ grossSalary: accrued });
  const totalAccrued = accrued + employee.bonus + employee.sickLeave;
  const totalWithheld = result.ipn + result.opv + result.vosms + employee.advance;
  const totalToPay = totalAccrued - totalWithheld;

  return {
    employee,
    accrued,
    totalAccrued,
    ipnBase: result.ipnBase,
    ipn: result.ipn,
    opv: result.opv,
    vosms: result.vosms,
    totalWithheld,
    totalToPay,
  };
}
