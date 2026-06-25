"use client";

import { useId, useState } from "react";
import { Plus, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoneyInput } from "@/components/calculators/MoneyInput";
import { ResultBreakdown, type BreakdownRow } from "@/components/ResultBreakdown";
import { calculateGph, calculatePayroll, prorateSalaryWithOvertime, type PayrollMode } from "@/lib/payroll";
import { payrollFormSchema } from "@/lib/schemas";
import { formatPercent, formatTenge } from "@/lib/format";
import { PAYROLL_BENEFIT_CATEGORIES, type BenefitCategory } from "@/lib/tax-config-2026";
import {
  WORKING_CALENDAR_2026,
  WORK_SCHEDULES,
  getWorkingNorm,
  type WorkSchedule,
} from "@/lib/working-calendar-2026";
import { useAutosaveCalculation } from "@/lib/hooks/useAutosaveCalculation";
import type { CalculationRow } from "@/lib/supabase/calculations";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";
import type { ReportData } from "@/lib/reports/types";

type PayrollSubMode = "single" | "multiple" | "gph";

const CURRENT_MONTH = new Date().getMonth() + 1;

interface EditableEmployee {
  id: number;
  name: string;
  position: string;
  grossSalary: number;
  daysWorked: number;
  hoursWorked: number;
  benefitCategory: BenefitCategory;
}

let nextEmployeeId = 1;
const createEmployee = (norm: { days: number; hours: number }): EditableEmployee => ({
  id: nextEmployeeId++,
  name: "",
  position: "",
  grossSalary: 300000,
  daysWorked: norm.days,
  hoursWorked: norm.hours,
  benefitCategory: "none",
});

interface SingleInput {
  subMode: "single";
  grossSalary: number;
  mode: PayrollMode;
  applyStandardDeduction: boolean;
  benefitCategory: BenefitCategory;
  bornBeforeJan1975: boolean;
}

interface MultipleInput {
  subMode: "multiple";
  mode: PayrollMode;
  applyStandardDeduction: boolean;
  bornBeforeJan1975: boolean;
  selectedMonth: number;
  schedule: WorkSchedule;
  employees: Array<{
    name: string;
    position: string;
    grossSalary: number;
    daysWorked: number;
    hoursWorked: number;
    benefitCategory: BenefitCategory;
  }>;
}

interface GphSavedInput {
  subMode: "gph";
  amount: number;
}

type PayrollSavedInput = SingleInput | MultipleInput | GphSavedInput;

export interface PayrollCalculatorProps {
  initialData?: CalculationRow;
  onSaved?: () => void;
}

export function PayrollCalculator({ initialData, onSaved }: PayrollCalculatorProps) {
  const initialInput = initialData?.input as PayrollSavedInput | undefined;

  const [subMode, setSubMode] = useState<PayrollSubMode>(initialInput?.subMode ?? "single");

  // Один сотрудник
  const [grossSalary, setGrossSalary] = useState(
    initialInput?.subMode === "single" ? initialInput.grossSalary : 300000
  );
  const [benefitCategory, setBenefitCategory] = useState<BenefitCategory>(
    initialInput?.subMode === "single" ? initialInput.benefitCategory : "none"
  );

  // Общие для «Один сотрудник» и «Несколько сотрудников»
  const [mode, setMode] = useState<PayrollMode>(
    initialInput?.subMode === "single" || initialInput?.subMode === "multiple"
      ? initialInput.mode
      : "too_our"
  );
  const [applyStandardDeduction, setApplyStandardDeduction] = useState(
    initialInput?.subMode === "single" || initialInput?.subMode === "multiple"
      ? initialInput.applyStandardDeduction
      : true
  );
  const [bornBeforeJan1975, setBornBeforeJan1975] = useState(
    initialInput?.subMode === "single" || initialInput?.subMode === "multiple"
      ? initialInput.bornBeforeJan1975
      : false
  );

  // Несколько сотрудников
  const [selectedMonth, setSelectedMonth] = useState(
    initialInput?.subMode === "multiple" ? initialInput.selectedMonth : CURRENT_MONTH
  );
  const [schedule, setSchedule] = useState<WorkSchedule>(
    initialInput?.subMode === "multiple" ? initialInput.schedule : "five_day"
  );
  const workingNorm = getWorkingNorm(selectedMonth, schedule);
  const [employees, setEmployees] = useState<EditableEmployee[]>(() =>
    initialInput?.subMode === "multiple" && initialInput.employees.length > 0
      ? initialInput.employees.map((e) => ({ ...createEmployee(workingNorm), ...e }))
      : [createEmployee(workingNorm)]
  );

  // ГПХ
  const [gphAmount, setGphAmount] = useState(
    initialInput?.subMode === "gph" ? initialInput.amount : 300000
  );

  const expenseId = useId();

  const validation = payrollFormSchema.safeParse({
    grossSalary,
    mode,
    applyStandardDeduction,
    benefitCategory,
    bornBeforeJan1975,
  });

  const result = calculatePayroll({
    grossSalary,
    mode,
    applyStandardDeduction,
    benefitCategory,
    bornBeforeJan1975,
  });

  const employeeResults = employees.map((employee) => {
    const overtime = prorateSalaryWithOvertime({
      grossSalary: employee.grossSalary,
      normDays: workingNorm.days,
      normHours: workingNorm.hours,
      daysWorked: employee.daysWorked,
      hoursWorked: employee.hoursWorked,
    });
    const result = calculatePayroll({
      grossSalary: overtime.accrued,
      mode,
      applyStandardDeduction,
      benefitCategory: employee.benefitCategory,
      bornBeforeJan1975,
    });
    // В ведомостях 1С статьи показывают полными суммами, без зачёта СО против СН
    // (зачёт по ст. 484 НК РК применяется при уплате на уровне декларации, не построчно).
    const totalWithheld = result.opv + result.vosms + result.ipn;
    const totalDeductions = result.standardDeduction + result.disabilityDeductionMonthly + result.vosms + result.opv;
    const totalEmployerGross = result.so + result.oosms + result.opvr + result.snGross;
    return {
      employee,
      proratedSalary: overtime.accrued,
      overtimeDaysPay: overtime.overtimeDaysPay,
      overtimeHoursPay: overtime.overtimeHoursPay,
      result,
      totalWithheld,
      totalDeductions,
      totalEmployerGross,
    };
  });
  const multipleTotals = employeeResults.reduce(
    (acc, { proratedSalary, overtimeDaysPay, overtimeHoursPay, result: r, totalWithheld, totalDeductions, totalEmployerGross }) => ({
      accrued: acc.accrued + proratedSalary,
      overtimeDaysPay: acc.overtimeDaysPay + overtimeDaysPay,
      overtimeHoursPay: acc.overtimeHoursPay + overtimeHoursPay,
      opv: acc.opv + r.opv,
      vosms: acc.vosms + r.vosms,
      ipn: acc.ipn + r.ipn,
      totalWithheld: acc.totalWithheld + totalWithheld,
      netIncome: acc.netIncome + r.netIncome,
      standardDeduction: acc.standardDeduction + r.standardDeduction,
      totalDeductions: acc.totalDeductions + totalDeductions,
      so: acc.so + r.so,
      oosms: acc.oosms + r.oosms,
      opvr: acc.opvr + r.opvr,
      snGross: acc.snGross + r.snGross,
      totalEmployerGross: acc.totalEmployerGross + totalEmployerGross,
      employerCost: acc.employerCost + r.employerCost,
    }),
    {
      accrued: 0,
      overtimeDaysPay: 0,
      overtimeHoursPay: 0,
      opv: 0,
      vosms: 0,
      ipn: 0,
      totalWithheld: 0,
      netIncome: 0,
      standardDeduction: 0,
      totalDeductions: 0,
      so: 0,
      oosms: 0,
      opvr: 0,
      snGross: 0,
      totalEmployerGross: 0,
      employerCost: 0,
    }
  );

  const gphResult = calculateGph({ amount: gphAmount });

  function updateEmployee(id: number, patch: Partial<EditableEmployee>) {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
  function addEmployee() {
    setEmployees((prev) => [...prev, createEmployee(workingNorm)]);
  }
  function removeEmployee(id: number) {
    setEmployees((prev) => (prev.length > 1 ? prev.filter((e) => e.id !== id) : prev));
  }
  function handleMonthChange(month: number) {
    setSelectedMonth(month);
    const newNorm = getWorkingNorm(month, schedule);
    setEmployees((prev) => prev.map((e) => ({ ...e, daysWorked: newNorm.days, hoursWorked: newNorm.hours })));
  }
  function handleScheduleChange(newSchedule: WorkSchedule) {
    setSchedule(newSchedule);
    const newNorm = getWorkingNorm(selectedMonth, newSchedule);
    setEmployees((prev) => prev.map((e) => ({ ...e, daysWorked: newNorm.days, hoursWorked: newNorm.hours })));
  }

  const savedInput: PayrollSavedInput =
    subMode === "single"
      ? { subMode, grossSalary, mode, applyStandardDeduction, benefitCategory, bornBeforeJan1975 }
      : subMode === "multiple"
        ? {
            subMode,
            mode,
            applyStandardDeduction,
            bornBeforeJan1975,
            selectedMonth,
            schedule,
            employees: employees.map(
              ({ name, position, grossSalary: gs, daysWorked, hoursWorked, benefitCategory: bc }) => ({
                name,
                position,
                grossSalary: gs,
                daysWorked,
                hoursWorked,
                benefitCategory: bc,
              })
            ),
          }
        : { subMode, amount: gphAmount };

  const savedResult =
    subMode === "single" ? result : subMode === "multiple" ? { employeeResults, multipleTotals } : gphResult;

  useAutosaveCalculation("fot", savedInput, savedResult, {
    initialId: initialData?.id,
    onSaved,
  });

  const reportData: ReportData =
    subMode === "single"
      ? {
          type: "fot",
          title: "Зарплата / ФОТ — один сотрудник",
          date: new Date().toISOString().slice(0, 10),
          inputs: [
            { label: "Начисленный оклад", value: formatTenge(grossSalary) },
            { label: "Режим работодателя", value: mode === "too_our" ? "ТОО на ОУР" : "ИП" },
            {
              label: "Льготная категория",
              value: PAYROLL_BENEFIT_CATEGORIES.find((c) => c.id === benefitCategory)?.label ?? "Нет",
            },
          ],
          rows: [
            { label: "ОПВ", value: formatTenge(result.opv) },
            { label: "ВОСМС", value: formatTenge(result.vosms) },
            { label: `ИПН (${formatPercent(result.ipnRate)})`, value: formatTenge(result.ipn) },
            { label: "На руки", value: formatTenge(result.netIncome), bold: true },
            { label: "Полная стоимость для работодателя", value: formatTenge(result.employerCost), bold: true },
          ],
        }
      : subMode === "multiple"
        ? {
            type: "fot",
            title: "Зарплата / ФОТ — несколько сотрудников",
            date: new Date().toISOString().slice(0, 10),
            orientation: "landscape",
            inputs: [
              { label: "Режим работодателя", value: mode === "too_our" ? "ТОО на ОУР" : "ИП" },
              {
                label: "Месяц",
                value: WORKING_CALENDAR_2026.find((m) => m.value === selectedMonth)?.label ?? String(selectedMonth),
              },
              {
                label: "График работы",
                value: WORK_SCHEDULES.find((s) => s.value === schedule)?.label ?? schedule,
              },
              {
                label: "Норма (40-час. неделя)",
                value: `${workingNorm.days} дн. / ${workingNorm.hours} ч.`,
              },
              { label: "Число сотрудников", value: String(employees.length) },
            ],
            rows: [],
            table: {
              columns: [
                { label: "Сотрудник", flex: 2.2 },
                { label: "Должность", flex: 1.8 },
                { label: "Оклад (тариф)", flex: 1.3, align: "right" },
                { label: "Дн.", flex: 0.6, align: "right" },
                { label: "Ч.", flex: 0.6, align: "right" },
                { label: "Льгота", flex: 1.4 },
                { label: "Начислено", flex: 1.3, align: "right" },
                { label: "в т.ч. переработка ×1,5", flex: 1.3, align: "right" },
                { label: "ОПВ", flex: 1, align: "right" },
                { label: "ОСМС", flex: 1, align: "right" },
                { label: "ИПН", flex: 1, align: "right" },
                { label: "Удержано", flex: 1.2, align: "right" },
                { label: "Выплачено", flex: 1.2, align: "right" },
                { label: "Баз. вычет", flex: 1, align: "right" },
                { label: "Выч. ВОСМС", flex: 1, align: "right" },
                { label: "Выч. ОПВ", flex: 1, align: "right" },
                { label: "Вычеты итого", flex: 1.1, align: "right" },
                { label: "СО", flex: 1, align: "right" },
                { label: "ОСМС", flex: 1, align: "right" },
                { label: "ОПВР", flex: 1, align: "right" },
                { label: "СН", flex: 1, align: "right" },
                { label: "Отчисления итого", flex: 1.3, align: "right" },
              ],
              rows: [
                ...employeeResults.map(
                  ({
                    employee,
                    proratedSalary,
                    overtimeDaysPay,
                    overtimeHoursPay,
                    result: r,
                    totalWithheld,
                    totalDeductions,
                    totalEmployerGross,
                  }) => [
                    employee.name || "Сотрудник",
                    employee.position || "—",
                    formatTenge(employee.grossSalary),
                    String(employee.daysWorked),
                    String(employee.hoursWorked),
                    PAYROLL_BENEFIT_CATEGORIES.find((c) => c.id === employee.benefitCategory)?.label ?? "—",
                    formatTenge(proratedSalary),
                    formatTenge(overtimeDaysPay + overtimeHoursPay),
                    formatTenge(r.opv),
                    formatTenge(r.vosms),
                    formatTenge(r.ipn),
                    formatTenge(totalWithheld),
                    formatTenge(r.netIncome),
                    formatTenge(r.standardDeduction),
                    formatTenge(r.vosms),
                    formatTenge(r.opv),
                    formatTenge(totalDeductions),
                    formatTenge(r.so),
                    formatTenge(r.oosms),
                    formatTenge(r.opvr),
                    formatTenge(r.snGross),
                    formatTenge(totalEmployerGross),
                  ]
                ),
                [
                  "ИТОГО",
                  "",
                  "",
                  "",
                  "",
                  "",
                  formatTenge(multipleTotals.accrued),
                  formatTenge(multipleTotals.overtimeDaysPay + multipleTotals.overtimeHoursPay),
                  formatTenge(multipleTotals.opv),
                  formatTenge(multipleTotals.vosms),
                  formatTenge(multipleTotals.ipn),
                  formatTenge(multipleTotals.totalWithheld),
                  formatTenge(multipleTotals.netIncome),
                  formatTenge(multipleTotals.standardDeduction),
                  formatTenge(multipleTotals.vosms),
                  formatTenge(multipleTotals.opv),
                  formatTenge(multipleTotals.totalDeductions),
                  formatTenge(multipleTotals.so),
                  formatTenge(multipleTotals.oosms),
                  formatTenge(multipleTotals.opvr),
                  formatTenge(multipleTotals.snGross),
                  formatTenge(multipleTotals.totalEmployerGross),
                ],
              ],
              boldRowIndexes: [employeeResults.length],
            },
          }
        : {
            type: "fot",
            title: "Договор ГПХ",
            date: new Date().toISOString().slice(0, 10),
            inputs: [{ label: "Сумма вознаграждения", value: formatTenge(gphAmount) }],
            rows: [
              { label: "ОПВ (10%)", value: formatTenge(gphResult.opv) },
              { label: "ВОСМС (2%)", value: formatTenge(gphResult.vosms) },
              { label: "ИПН (10%)", value: formatTenge(gphResult.ipn) },
              { label: "На руки исполнителю", value: formatTenge(gphResult.netIncome), bold: true },
              { label: "Стоимость для заказчика", value: formatTenge(gphResult.customerCost), bold: true },
            ],
          };

  const employeeRows: BreakdownRow[] = [
    { label: "ОПВ", value: result.opv, hint: "10% с работника, база ограничена 50 × МЗП" },
    { label: "ВОСМС", value: result.vosms, hint: "2% с работника, база ограничена 20 × МЗП" },
  ];

  if (result.standardDeduction > 0) {
    employeeRows.push({
      label: "Вычет 30 МРП",
      value: result.standardDeduction,
      tone: "muted",
      hint: "Уменьшает базу для расчёта ИПН",
    });
  }
  if (result.disabilityDeductionMonthly > 0) {
    employeeRows.push({
      label: "Доп. вычет (инвалидность)",
      value: result.disabilityDeductionMonthly,
      tone: "muted",
      hint: "882 МРП в год ÷ 12",
    });
  }

  employeeRows.push({
    label: `ИПН (${formatPercent(result.ipnRate)})`,
    value: result.ipn,
    bold: true,
    tone: result.ipn === 0 ? "success" : "default",
    hint: result.isProgressiveIpn
      ? "Применена прогрессивная ставка — годовой доход превышает 8 500 МРП"
      : undefined,
  });

  const employerRows: BreakdownRow[] = [
    { label: "СО", value: result.so, hint: "5% от (оклад − ОПВ), в пределах 1–7 × МЗП" },
    { label: "ООСМС", value: result.oosms, hint: "3% с работодателя, база ограничена 40 × МЗП" },
    {
      label: "ОПВР",
      value: result.opvr,
      hint: bornBeforeJan1975
        ? "Не начисляется — работник рождён до 01.01.1975"
        : "3,5% от оклада",
    },
    { label: "СН", value: result.sn, bold: true, hint: "6% × (оклад − ОПВ − ВОСМС), уменьшен на СО" },
  ];

  const gphRows: BreakdownRow[] = [
    { label: "ОПВ (10%)", value: gphResult.opv },
    { label: "ВОСМС (2%)", value: gphResult.vosms },
    { label: "ИПН (10%)", value: gphResult.ipn, bold: true },
  ];

  const sharedSettingsFields =
    subMode !== "gph" ? (
      <>
        <div className="space-y-1.5">
          <Label className="text-sm text-text-muted">Режим работодателя</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as PayrollMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="too_our">ТОО на ОУР</SelectItem>
              <SelectItem value="ip">ИП</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
          <div>
            <Label htmlFor="standard-deduction" className="text-sm">
              Применять вычет 30 МРП
            </Label>
            <p className="text-xs text-text-muted">Стандартный налоговый вычет по ИПН</p>
          </div>
          <Switch
            id="standard-deduction"
            checked={applyStandardDeduction}
            onCheckedChange={setApplyStandardDeduction}
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
          <div>
            <Label htmlFor="born-before-1975" className="text-sm">
              Рождён(а) до 01.01.1975
            </Label>
            <p className="text-xs text-text-muted">Освобождает от ОПВР</p>
          </div>
          <Switch
            id="born-before-1975"
            checked={bornBeforeJan1975}
            onCheckedChange={setBornBeforeJan1975}
          />
        </div>
      </>
    ) : null;

  return (
    <div className="space-y-6">
      <Tabs value={subMode} onValueChange={(v) => setSubMode(v as PayrollSubMode)}>
        <TabsList className="bg-surface-tint p-1">
          <TabsTrigger value="single" className="rounded-md px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            Один сотрудник
          </TabsTrigger>
          <TabsTrigger value="multiple" className="rounded-md px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            Несколько сотрудников
          </TabsTrigger>
          <TabsTrigger value="gph" className="rounded-md px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            ГПХ
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {subMode === "single" ? (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <Card className="rounded-2xl border-border shadow-soft">
            <CardHeader>
              <CardTitle>Зарплата / ФОТ</CardTitle>
              <CardDescription>Форма 200 — расчёт по одному работнику</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <MoneyInput
                label="Начисленный оклад (грязными)"
                value={grossSalary}
                onChange={setGrossSalary}
                error={!validation.success ? validation.error.issues[0]?.message : undefined}
              />

              {sharedSettingsFields}

              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">Льготная категория</Label>
                <Select
                  value={benefitCategory}
                  onValueChange={(v) => setBenefitCategory(v as BenefitCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYROLL_BENEFIT_CATEGORIES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <ResultBreakdown
              title="Расчёт на работника"
              highlights={[{ label: "На руки", value: result.netIncome }]}
              rows={employeeRows}
            />
            <ResultBreakdown
              title="Расходы работодателя сверх оклада"
              highlights={[{ label: "Полная стоимость для работодателя", value: result.employerCost }]}
              rows={employerRows}
            />
          </div>
        </div>
      ) : null}

      {subMode === "multiple" ? (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <Card className="rounded-2xl border-border shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Параметры</CardTitle>
              <CardDescription>Общие для всех сотрудников</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {sharedSettingsFields}
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">Месяц</Label>
                <Select value={String(selectedMonth)} onValueChange={(v) => handleMonthChange(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKING_CALENDAR_2026.map((m) => (
                      <SelectItem key={m.value} value={String(m.value)}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">График работы</Label>
                <Select value={schedule} onValueChange={(v) => handleScheduleChange(v as WorkSchedule)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_SCHEDULES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-text-muted">
                  Норма — {workingNorm.days} раб. дней, {workingNorm.hours} ч. (40-час. неделя). При смене
                  месяца или графика дни/часы у всех сотрудников подставляются автоматически. Дни и часы
                  сверх нормы оплачиваются по ставке ×1,5
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Сотрудники</CardTitle>
                <CardDescription>
                  Полная расшифровка по каждому сотруднику — в PDF при печати
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addEmployee} className="gap-1">
                <Plus className="h-4 w-4" />
                Добавить
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px] text-text-muted">Сотрудник</TableHead>
                    <TableHead className="min-w-[180px] text-text-muted">Должность</TableHead>
                    <TableHead className="min-w-[160px] text-text-muted">Оклад (тариф)</TableHead>
                    <TableHead className="min-w-[140px] text-text-muted">Отр. дней</TableHead>
                    <TableHead className="min-w-[140px] text-text-muted">Отр. часов</TableHead>
                    <TableHead className="min-w-[180px] text-text-muted">Льгота</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <Input
                          value={employee.name}
                          onChange={(e) => updateEmployee(employee.id, { name: e.target.value })}
                          placeholder="Имя сотрудника"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={employee.position}
                          onChange={(e) => updateEmployee(employee.id, { position: e.target.value })}
                          placeholder="Должность"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          className="font-tabular"
                          value={employee.grossSalary || ""}
                          onChange={(e) =>
                            updateEmployee(employee.id, {
                              grossSalary: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          className="font-tabular"
                          value={employee.daysWorked || ""}
                          onChange={(e) =>
                            updateEmployee(employee.id, {
                              daysWorked: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          className="font-tabular"
                          value={employee.hoursWorked || ""}
                          onChange={(e) =>
                            updateEmployee(employee.id, {
                              hoursWorked: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={employee.benefitCategory}
                          onValueChange={(v) =>
                            updateEmployee(employee.id, { benefitCategory: v as BenefitCategory })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAYROLL_BENEFIT_CATEGORIES.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-text-muted hover:text-danger"
                          onClick={() => removeEmployee(employee.id)}
                          disabled={employees.length === 1}
                          aria-label="Удалить сотрудника"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
                <div className="rounded-xl bg-primary-bg px-4 py-4">
                  <p className="text-sm text-text-muted">Итого выплачено (на руки)</p>
                  <p className="font-tabular mt-1 text-2xl font-semibold text-primary">
                    {formatTenge(multipleTotals.netIncome)}
                  </p>
                </div>
                <div className="rounded-xl bg-primary-bg px-4 py-4">
                  <p className="text-sm text-text-muted">Всего отчислений (работодатель)</p>
                  <p className="font-tabular mt-1 text-2xl font-semibold text-primary">
                    {formatTenge(multipleTotals.totalEmployerGross)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {subMode === "gph" ? (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <Card className="rounded-2xl border-border shadow-soft">
            <CardHeader>
              <CardTitle>Договор ГПХ</CardTitle>
              <CardDescription>Гражданско-правового характера</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <MoneyInput
                label="Сумма вознаграждения по договору"
                value={gphAmount}
                onChange={setGphAmount}
              />
              <p className="text-xs text-text-muted" id={expenseId}>
                По ГПХ удерживаются только ИПН 10%, ОПВ 10% и ВОСМС 2% — социальный налог,
                социальные отчисления, ООСМС и ОПВР работодателя (заказчика) не начисляются,
                в отличие от трудового договора.
              </p>
            </CardContent>
          </Card>

          <ResultBreakdown
            title="Расчёт по договору ГПХ"
            highlights={[
              { label: "На руки исполнителю", value: gphResult.netIncome },
              { label: "Стоимость для заказчика", value: gphResult.customerCost },
            ]}
            rows={gphRows}
          />
        </div>
      ) : null}

      <DownloadPdfButton data={reportData} />
    </div>
  );
}
