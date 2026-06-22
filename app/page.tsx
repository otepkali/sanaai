import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { PayrollCalculator } from "@/components/calculators/PayrollCalculator";
import { SimplifiedCalculator } from "@/components/calculators/SimplifiedCalculator";
import { VatCalculator } from "@/components/calculators/VatCalculator";
import { CompareCalculator } from "@/components/calculators/CompareCalculator";

const TAB_TRIGGER_CLASS =
  "rounded-md px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border bg-gradient-to-b from-white to-surface-tint">
        <div className="container flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Sana Ai" width={160} height={60} className="h-9 w-auto" priority />
            <span className="hidden border-l border-border pl-3 text-sm text-text-muted sm:block">
              Налоговый калькулятор РК
            </span>
          </div>
          <ThemeToggle />
        </div>
        <div className="container pb-12 pt-4">
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            Налоги Казахстана 2026 — быстро, точно, с разбивкой каждой суммы
          </h1>
          <p className="mt-3 max-w-xl text-text-muted">
            ФОТ, упрощённая декларация (910), НДС и сравнение режимов — в одном инструменте
            для бухгалтеров и владельцев ИП.
          </p>
        </div>
      </header>

      <main className="container flex-1 py-8">
        <Tabs defaultValue="payroll">
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
          </TabsList>

          <TabsContent value="payroll" className="mt-6">
            <PayrollCalculator />
          </TabsContent>
          <TabsContent value="simplified" className="mt-6">
            <SimplifiedCalculator />
          </TabsContent>
          <TabsContent value="vat" className="mt-6">
            <VatCalculator />
          </TabsContent>
          <TabsContent value="compare" className="mt-6">
            <CompareCalculator />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border bg-surface-tint/60">
        <div className="container py-6 text-xs leading-relaxed text-text-muted">
          Калькулятор носит справочный характер. Ставки актуальны на 2026 год. Для официальных
          расчётов сверяйтесь с Налоговым кодексом РК и консультируйтесь с бухгалтером.
        </div>
      </footer>
    </div>
  );
}
