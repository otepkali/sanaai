"use client";

import { useMemo, useState } from "react";
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
import { MoneyInput } from "@/components/calculators/MoneyInput";
import { ResultBreakdown, type BreakdownRow } from "@/components/ResultBreakdown";
import { calculatePayroll, type PayrollMode } from "@/lib/payroll";
import { payrollFormSchema } from "@/lib/schemas";
import { formatPercent } from "@/lib/format";
import { PAYROLL_BENEFIT_CATEGORIES, type BenefitCategory } from "@/lib/tax-config-2026";

export function PayrollCalculator() {
  const [grossSalary, setGrossSalary] = useState(300000);
  const [mode, setMode] = useState<PayrollMode>("too_our");
  const [applyStandardDeduction, setApplyStandardDeduction] = useState(true);
  const [benefitCategory, setBenefitCategory] = useState<BenefitCategory>("none");
  const [bornBeforeJan1975, setBornBeforeJan1975] = useState(false);

  const validation = payrollFormSchema.safeParse({
    grossSalary,
    mode,
    applyStandardDeduction,
    benefitCategory,
    bornBeforeJan1975,
  });

  const result = useMemo(
    () =>
      calculatePayroll({
        grossSalary,
        mode,
        applyStandardDeduction,
        benefitCategory,
        bornBeforeJan1975,
      }),
    [grossSalary, mode, applyStandardDeduction, benefitCategory, bornBeforeJan1975]
  );

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

  return (
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
  );
}
