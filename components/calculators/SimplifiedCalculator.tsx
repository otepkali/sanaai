"use client";

import { useId, useState } from "react";
import { CalendarClock, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MoneyInput } from "@/components/calculators/MoneyInput";
import { ResultBreakdown, type BreakdownRow } from "@/components/ResultBreakdown";
import { calculateSimplifiedTax } from "@/lib/simplified";
import { simplifiedFormSchema } from "@/lib/schemas";
import { formatPercent, formatTenge } from "@/lib/format";
import { SIMPLIFIED_REGIONS, type SimplifiedRegionId } from "@/lib/tax-config-2026";
import { useAutosaveCalculation } from "@/lib/hooks/useAutosaveCalculation";
import type { CalculationRow } from "@/lib/supabase/calculations";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";
import type { ReportData } from "@/lib/reports/types";

const MONTH_LABELS_HALF1 = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь"];
const MONTH_LABELS_HALF2 = ["Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

type IncomeMode = "lump" | "monthly";

interface SimplifiedSavedInput {
  incomeMode: IncomeMode;
  lumpIncome: number;
  monthlyIncomes: number[];
  half: 1 | 2;
  regionId: SimplifiedRegionId;
  employeeCount: number;
  employeesHalfYearPayroll: number;
}

export interface SimplifiedCalculatorProps {
  initialData?: CalculationRow;
  onSaved?: () => void;
}

export function SimplifiedCalculator({ initialData, onSaved }: SimplifiedCalculatorProps) {
  const initialInput = initialData?.input as SimplifiedSavedInput | undefined;
  const employeeCountId = useId();

  const [incomeMode, setIncomeMode] = useState<IncomeMode>(initialInput?.incomeMode ?? "lump");
  const [lumpIncome, setLumpIncome] = useState(initialInput?.lumpIncome ?? 10_000_000);
  const [monthlyIncomes, setMonthlyIncomes] = useState<number[]>(
    initialInput?.monthlyIncomes ?? [0, 0, 0, 0, 0, 0]
  );
  const [half, setHalf] = useState<1 | 2>(initialInput?.half ?? 1);
  const [regionId, setRegionId] = useState<SimplifiedRegionId>(initialInput?.regionId ?? "default");
  const [employeeCount, setEmployeeCount] = useState(initialInput?.employeeCount ?? 0);
  const [employeesHalfYearPayroll, setEmployeesHalfYearPayroll] = useState(
    initialInput?.employeesHalfYearPayroll ?? 0
  );

  const halfYearIncome =
    incomeMode === "monthly" ? monthlyIncomes.reduce((sum, v) => sum + v, 0) : lumpIncome;

  function updateMonthlyIncome(index: number, value: number) {
    setMonthlyIncomes((prev) => prev.map((v, i) => (i === index ? value : v)));
  }

  const validation = simplifiedFormSchema.safeParse({
    halfYearIncome,
    regionId,
    employeeCount,
    employeesHalfYearPayroll,
  });

  const result = calculateSimplifiedTax({
    halfYearIncome,
    regionId,
    employeeCount,
    employeesHalfYearPayroll,
  });

  useAutosaveCalculation(
    "simplified",
    {
      incomeMode,
      lumpIncome,
      monthlyIncomes,
      half,
      regionId,
      employeeCount,
      employeesHalfYearPayroll,
    },
    result,
    { initialId: initialData?.id, onSaved }
  );

  const rows: BreakdownRow[] = [
    {
      label: `Налог до льготы (${formatPercent(result.rate)} × доход)`,
      value: result.taxBeforeDiscount,
    },
  ];

  if (employeeCount > 0) {
    rows.push({
      label: "Льготная ставка за работников (1,5% за каждого)",
      value: -result.discountAmount,
      tone: result.discountAmount > 0 ? "success" : "muted",
      hint: result.isEmployeeDiscountEligible
        ? `Применена: 1,5% × ${result.qualifyingEmployees} раб. — средняя ЗП ${formatTenge(result.averageMonthlyEmployeeSalary)}/мес ≥ 25 МРП`
        : `Не применяется — средняя ЗП ${formatTenge(result.averageMonthlyEmployeeSalary)}/мес ниже порога 25 МРП (${formatTenge(25 * 4325)})`,
    });
  }

  rows.push({ label: "Налог к уплате", value: result.tax, bold: true });

  const limitBadge =
    result.limitUsageRatio >= 1
      ? { text: "Превышен лимит 600 000 МРП", tone: "danger" as const }
      : result.limitUsageRatio >= 0.9
        ? { text: "Близко к лимиту 600 000 МРП", tone: "warning" as const }
        : undefined;

  const monthLabels = half === 1 ? MONTH_LABELS_HALF1 : MONTH_LABELS_HALF2;
  const deadline = half === 1 ? "15 августа" : "15 февраля (следующего года)";

  const reportData: ReportData = {
    type: "simplified",
    title: "Упрощённая декларация (910)",
    date: new Date().toISOString().slice(0, 10),
    inputs: [
      { label: "Доход за полугодие", value: formatTenge(halfYearIncome) },
      { label: "Регион", value: SIMPLIFIED_REGIONS.find((r) => r.id === regionId)?.label ?? regionId },
      { label: "Число работников", value: String(employeeCount) },
      { label: "ФОТ работников за полугодие", value: formatTenge(employeesHalfYearPayroll) },
    ],
    rows: [
      { label: `Налог до льготы (${formatPercent(result.rate)})`, value: formatTenge(result.taxBeforeDiscount) },
      { label: "Льгота за работников", value: formatTenge(result.discountAmount) },
      { label: "Налог к уплате", value: formatTenge(result.tax), bold: true },
    ],
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader>
          <CardTitle>Упрощённая декларация</CardTitle>
          <CardDescription>Форма 910 — расчёт за полугодие</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-sm text-text-muted">Полугодие</Label>
            <Select value={String(half)} onValueChange={(v) => setHalf(Number(v) as 1 | 2)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1-е полугодие (январь–июнь)</SelectItem>
                <SelectItem value="2">2-е полугодие (июль–декабрь)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
            <div>
              <Label htmlFor="income-mode" className="text-sm">
                Вводить доход по месяцам
              </Label>
              <p className="text-xs text-text-muted">Вместо одной суммы за полугодие</p>
            </div>
            <Switch
              id="income-mode"
              checked={incomeMode === "monthly"}
              onCheckedChange={(checked) => setIncomeMode(checked ? "monthly" : "lump")}
            />
          </div>

          {incomeMode === "lump" ? (
            <MoneyInput
              label="Доход за полугодие"
              value={lumpIncome}
              onChange={setLumpIncome}
              error={!validation.success ? validation.error.issues[0]?.message : undefined}
            />
          ) : (
            <div className="space-y-3">
              {monthLabels.map((label, index) => (
                <MoneyInput
                  key={label}
                  label={label}
                  value={monthlyIncomes[index]}
                  onChange={(v) => updateMonthlyIncome(index, v)}
                />
              ))}
              <div className="flex justify-between rounded-lg bg-surface-tint px-3 py-2 text-sm">
                <span className="text-text-muted">Сумма за полугодие</span>
                <span className="font-tabular font-medium text-text">{formatTenge(halfYearIncome)}</span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm text-text-muted">Регион (ставка маслихата)</Label>
            <Select value={regionId} onValueChange={(v) => setRegionId(v as SimplifiedRegionId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIMPLIFIED_REGIONS.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label} — {formatPercent(r.rate)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-text-muted">
              Список и ставки маслихатов ориентировочные, уточняйте в своём акимате.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={employeeCountId} className="text-sm text-text-muted">
              Число работников
            </Label>
            <Input
              id={employeeCountId}
              type="number"
              min={0}
              inputMode="numeric"
              value={employeeCount || ""}
              onChange={(e) => setEmployeeCount(Math.max(0, Number(e.target.value) || 0))}
              placeholder="0"
              className="font-tabular"
            />
          </div>

          <MoneyInput
            label="ФОТ работников за полугодие"
            value={employeesHalfYearPayroll}
            onChange={setEmployeesHalfYearPayroll}
            hint="Суммарно начислено всем работникам за те же 6 месяцев"
          />
        </CardContent>
      </Card>

      <div className="space-y-6">
        <ResultBreakdown
          title="Расчёт по форме 910"
          highlights={[
            { label: "Налог к уплате", value: result.tax },
            {
              label: "Оценка годового дохода",
              value: result.annualIncomeEstimate,
              sublabel: `${formatPercent(result.limitUsageRatio, 0)} от лимита 600 000 МРП`,
            },
          ]}
          rows={rows}
          badge={limitBadge}
        />

        <Alert className="border-border bg-surface-tint">
          <CalendarClock className="h-4 w-4 text-primary" />
          <AlertDescription className="text-text-muted">
            Срок сдачи формы 910 за выбранное полугодие — до <strong className="text-text">{deadline}</strong>.
            За 1-е полугодие — до 15 августа, за 2-е — до 15 февраля следующего года.
          </AlertDescription>
        </Alert>

        <Alert className="border-border bg-surface-tint">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-text-muted">
            На упрощённой декларации в 2026 году НДС и социальный налог для ИП не уплачиваются.
            Декларация подаётся дважды в год — по итогам каждого полугодия.
          </AlertDescription>
        </Alert>

        <DownloadPdfButton data={reportData} />
      </div>
    </div>
  );
}
