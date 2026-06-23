"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistorySidebar } from "@/components/HistorySidebar";
import { PayrollCalculator } from "@/components/calculators/PayrollCalculator";
import { SimplifiedCalculator } from "@/components/calculators/SimplifiedCalculator";
import { VatCalculator } from "@/components/calculators/VatCalculator";
import { CompareCalculator } from "@/components/calculators/CompareCalculator";
import { InvoiceForm } from "@/components/InvoiceForm";
import type { CalculationRow, CalculationType } from "@/lib/supabase/calculations";

const TAB_TRIGGER_CLASS =
  "rounded-md px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm";

const TYPE_TO_TAB: Record<CalculationType, string> = {
  fot: "payroll",
  simplified: "simplified",
  vat: "vat",
  comparison: "compare",
};

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("payroll");
  const [restoreCounter, setRestoreCounter] = useState(0);
  const [restoredRows, setRestoredRows] = useState<Partial<Record<CalculationType, CalculationRow>>>(
    {}
  );
  const [refreshSignal, setRefreshSignal] = useState(0);

  function handleRestore(row: CalculationRow) {
    setRestoredRows((prev) => ({ ...prev, [row.type]: row }));
    setActiveTab(TYPE_TO_TAB[row.type]);
    setRestoreCounter((c) => c + 1);
  }

  function bumpRefresh() {
    setRefreshSignal((s) => s + 1);
  }

  const payrollRow = restoredRows.fot;
  const simplifiedRow = restoredRows.simplified;
  const vatRow = restoredRows.vat;
  const compareRow = restoredRows.comparison;

  return (
    <div className="flex flex-1">
      <HistorySidebar onRestore={handleRestore} refreshSignal={refreshSignal} />

      <main className="container flex-1 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto flex-wrap gap-1 bg-surface-tint p-1">
            <TabsTrigger value="payroll" className={TAB_TRIGGER_CLASS}>
              ФОТ
            </TabsTrigger>
            <TabsTrigger value="simplified" className={TAB_TRIGGER_CLASS}>
              Упрощёнка
            </TabsTrigger>
            <TabsTrigger value="vat" className={TAB_TRIGGER_CLASS}>
              НДС
            </TabsTrigger>
            <TabsTrigger value="compare" className={TAB_TRIGGER_CLASS}>
              Сравнение режимов
            </TabsTrigger>
            <TabsTrigger value="invoice" className={TAB_TRIGGER_CLASS}>
              Счёт на оплату
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payroll" className="mt-6">
            <PayrollCalculator
              key={`payroll-${payrollRow?.id ?? "default"}-${restoreCounter}`}
              initialData={payrollRow}
              onSaved={bumpRefresh}
            />
          </TabsContent>
          <TabsContent value="simplified" className="mt-6">
            <SimplifiedCalculator
              key={`simplified-${simplifiedRow?.id ?? "default"}-${restoreCounter}`}
              initialData={simplifiedRow}
              onSaved={bumpRefresh}
            />
          </TabsContent>
          <TabsContent value="vat" className="mt-6">
            <VatCalculator
              key={`vat-${vatRow?.id ?? "default"}-${restoreCounter}`}
              initialData={vatRow}
              onSaved={bumpRefresh}
            />
          </TabsContent>
          <TabsContent value="compare" className="mt-6">
            <CompareCalculator
              key={`compare-${compareRow?.id ?? "default"}-${restoreCounter}`}
              initialData={compareRow}
              onSaved={bumpRefresh}
            />
          </TabsContent>
          <TabsContent value="invoice" className="mt-6">
            <InvoiceForm />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
