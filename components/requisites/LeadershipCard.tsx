"use client";

import { useId } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileSlot } from "@/components/requisites/FileSlot";
import type { CompanyRequisites } from "@/lib/documents/types";

export function LeadershipCard({
  requisites,
  onChange,
  onUploadSignature,
  isUploadingSignature,
  signatureError,
}: {
  requisites: CompanyRequisites;
  onChange: (fields: Partial<CompanyRequisites>) => void;
  onUploadSignature: (file: File) => void;
  isUploadingSignature: boolean;
  signatureError: string | null;
}) {
  const directorId = useId();
  const accountantId = useId();
  const addressId = useId();

  return (
    <Card className="rounded-2xl border-border shadow-soft">
      <CardHeader>
        <CardTitle>Руководство и адрес для документов</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={directorId} className="text-sm text-text-muted">
              Руководитель
            </Label>
            <Input
              id={directorId}
              value={requisites.directorName}
              onChange={(e) => onChange({ directorName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={accountantId} className="text-sm text-text-muted">
              Главный бухгалтер
            </Label>
            <Input
              id={accountantId}
              value={requisites.accountantName}
              onChange={(e) => onChange({ accountantName: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={addressId} className="text-sm text-text-muted">
            Адрес для документов
          </Label>
          <Input id={addressId} value={requisites.address} onChange={(e) => onChange({ address: e.target.value })} />
          <p className="text-xs text-text-muted">
            Используется в АВР, доверенностях и накладных — отдельно от адресов из карточки «Адреса» ниже.
          </p>
        </div>

        <FileSlot
          label="Подпись руководителя"
          path={requisites.signaturePath}
          onUpload={onUploadSignature}
          isUploading={isUploadingSignature}
          error={signatureError}
        />
      </CardContent>
    </Card>
  );
}
