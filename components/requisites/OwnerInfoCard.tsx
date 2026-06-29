"use client";

import { useId } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CompanyRequisites } from "@/lib/documents/types";

export function OwnerInfoCard({
  requisites,
  onChange,
}: {
  requisites: CompanyRequisites;
  onChange: (fields: Partial<CompanyRequisites>) => void;
}) {
  const ownerNameId = useId();
  const incomeId = useId();
  const statusesId = useId();

  return (
    <Card className="rounded-2xl border-border shadow-soft">
      <CardHeader>
        <CardTitle>Индивидуальный предприниматель</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={ownerNameId} className="text-sm text-text-muted">
            ФИО владельца
          </Label>
          <Input
            id={ownerNameId}
            value={requisites.ownerFullName}
            onChange={(e) => onChange({ ownerFullName: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-text-muted">ИИН/БИН владельца</Label>
          <p className="font-tabular text-sm text-text">{requisites.binIin || "—"}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={incomeId} className="text-sm text-text-muted">
            Доход для исчисления ОПВ и СО
          </Label>
          <Input
            id={incomeId}
            type="number"
            value={requisites.ownerMonthlyIncome ?? ""}
            onChange={(e) => onChange({ ownerMonthlyIncome: e.target.value ? Number(e.target.value) : null })}
            placeholder="85000"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={statusesId} className="text-sm text-text-muted">
            Статусы
          </Label>
          <Textarea
            id={statusesId}
            value={requisites.ownerStatuses}
            onChange={(e) => onChange({ ownerStatuses: e.target.value })}
            placeholder="Гражданин, Пенсионер: По возрасту"
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}
