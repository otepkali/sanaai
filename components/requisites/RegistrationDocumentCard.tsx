"use client";

import { useId } from "react";
import { Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { CompanyRequisites } from "@/lib/documents/types";

export function RegistrationDocumentCard({
  requisites,
  onChange,
  onDelete,
}: {
  requisites: CompanyRequisites;
  onChange: (fields: Partial<CompanyRequisites>) => void;
  onDelete: () => void;
}) {
  const numberId = useId();
  const dateId = useId();
  const hasDocument = requisites.registrationCertificateNumber || requisites.registrationCertificateDate;

  return (
    <Card className="rounded-2xl border-border shadow-soft">
      <CardHeader>
        <CardTitle>Документы</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm font-medium text-text">Свидетельство о регистрации</p>
        <div className="space-y-1.5">
          <Label htmlFor={numberId} className="text-sm text-text-muted">
            Номер
          </Label>
          <Input
            id={numberId}
            value={requisites.registrationCertificateNumber}
            onChange={(e) => onChange({ registrationCertificateNumber: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={dateId} className="text-sm text-text-muted">
            Дата
          </Label>
          <Input
            id={dateId}
            type="date"
            value={requisites.registrationCertificateDate ?? ""}
            onChange={(e) => onChange({ registrationCertificateDate: e.target.value || null })}
          />
        </div>
        {hasDocument ? (
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1.5 text-sm text-danger transition-colors hover:text-danger/80"
          >
            Удалить документ
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </CardContent>
    </Card>
  );
}
