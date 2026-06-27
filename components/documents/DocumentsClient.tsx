"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { InvoiceForm } from "@/components/InvoiceForm";
import { AvrForm } from "@/components/documents/AvrForm";
import { PoaForm } from "@/components/documents/PoaForm";
import { WaybillForm } from "@/components/documents/WaybillForm";
import { PayrollSheetForm } from "@/components/documents/PayrollSheetForm";

const TAB_TRIGGER_CLASS =
  "rounded-md px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm";

export function DocumentsClient() {
  const [activeTab, setActiveTab] = useState("invoice");

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="outline" size="sm" asChild className="gap-2">
          <Link href="/documents/requisites">
            <Settings className="h-4 w-4" />
            Реквизиты компании
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap gap-1 bg-surface-tint p-1">
          <TabsTrigger value="invoice" className={TAB_TRIGGER_CLASS}>
            Счёт на оплату
          </TabsTrigger>
          <TabsTrigger value="avr" className={TAB_TRIGGER_CLASS}>
            АВР
          </TabsTrigger>
          <TabsTrigger value="poa" className={TAB_TRIGGER_CLASS}>
            Доверенность
          </TabsTrigger>
          <TabsTrigger value="payroll" className={TAB_TRIGGER_CLASS}>
            Расчётная ведомость
          </TabsTrigger>
          <TabsTrigger value="waybill" className={TAB_TRIGGER_CLASS}>
            Накладная
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoice" className="mt-6">
          <InvoiceForm />
        </TabsContent>
        <TabsContent value="avr" className="mt-6">
          <AvrForm />
        </TabsContent>
        <TabsContent value="poa" className="mt-6">
          <PoaForm />
        </TabsContent>
        <TabsContent value="payroll" className="mt-6">
          <PayrollSheetForm />
        </TabsContent>
        <TabsContent value="waybill" className="mt-6">
          <WaybillForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
