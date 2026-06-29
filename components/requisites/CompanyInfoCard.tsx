"use client";

import { useId } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FileSlot } from "@/components/requisites/FileSlot";
import type { CompanyRequisites } from "@/lib/documents/types";

export function CompanyInfoCard({
  requisites,
  onChange,
  onUploadLogo,
  isUploadingLogo,
  logoError,
}: {
  requisites: CompanyRequisites;
  onChange: (fields: Partial<CompanyRequisites>) => void;
  onUploadLogo: (file: File) => void;
  isUploadingLogo: boolean;
  logoError: string | null;
}) {
  const companyNameId = useId();
  const binIinId = useId();
  const regimeId = useId();
  const singlePaymentId = useId();
  const residencyId = useId();
  const kbeId = useId();

  return (
    <Card className="rounded-2xl border-border shadow-soft">
      <CardHeader>
        <CardTitle>Реквизиты организации</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
          <div>
            <Label htmlFor="is-ip" className="text-sm">
              Индивидуальный предприниматель
            </Label>
            <p className="text-xs text-text-muted">Выключено — значит ТОО</p>
          </div>
          <Switch
            id="is-ip"
            checked={requisites.isIndividualEntrepreneur}
            onCheckedChange={(v) => onChange({ isIndividualEntrepreneur: v })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={companyNameId} className="text-sm text-text-muted">
            Наименование организации
          </Label>
          <Input
            id={companyNameId}
            value={requisites.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            placeholder='ИП "Иванов" / ТОО "Компания"'
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={binIinId} className="text-sm text-text-muted">
            БИН / ИИН
          </Label>
          <Input
            id={binIinId}
            value={requisites.binIin}
            onChange={(e) => onChange({ binIin: e.target.value })}
            className="font-tabular"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={regimeId} className="text-sm text-text-muted">
              Режим налогообложения
            </Label>
            <Input
              id={regimeId}
              value={requisites.regime}
              onChange={(e) => onChange({ regime: e.target.value })}
              placeholder="Розничный налог"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={singlePaymentId} className="text-sm text-text-muted">
              Единый платёж
            </Label>
            <Input
              id={singlePaymentId}
              value={requisites.singlePaymentStatus}
              onChange={(e) => onChange({ singlePaymentStatus: e.target.value })}
              placeholder="Неплательщик ЕП"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={residencyId} className="text-sm text-text-muted">
              Страна резидентства
            </Label>
            <Input
              id={residencyId}
              value={requisites.residencyCountry}
              onChange={(e) => onChange({ residencyCountry: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={kbeId} className="text-sm text-text-muted">
              Код бенефициара (КБе)
            </Label>
            <Input id={kbeId} value={requisites.kbe} onChange={(e) => onChange({ kbe: e.target.value })} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
          <div>
            <Label htmlFor="is-vat" className="text-sm">
              Плательщик НДС
            </Label>
            <p className="text-xs text-text-muted">{requisites.isVatPayer ? "Плательщик НДС" : "Без НДС"}</p>
          </div>
          <Switch id="is-vat" checked={requisites.isVatPayer} onCheckedChange={(v) => onChange({ isVatPayer: v })} />
        </div>

        <FileSlot
          label="Логотип"
          path={requisites.logoPath}
          onUpload={onUploadLogo}
          isUploading={isUploadingLogo}
          error={logoError}
        />
      </CardContent>
    </Card>
  );
}
