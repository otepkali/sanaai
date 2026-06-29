"use client";

import { useId } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { CompanyRequisites } from "@/lib/documents/types";

export function TaxAuthorityCard({
  requisites,
  onChange,
}: {
  requisites: CompanyRequisites;
  onChange: (fields: Partial<CompanyRequisites>) => void;
}) {
  const registrationId = useId();
  const residenceId = useId();
  const akimatId = useId();

  return (
    <Card className="rounded-2xl border-border shadow-soft">
      <CardHeader>
        <CardTitle>Код налогового органа</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={registrationId} className="text-sm text-text-muted">
            Код УГД по месту регистрации
          </Label>
          <Input
            id={registrationId}
            value={requisites.taxAuthorityRegistration}
            onChange={(e) => onChange({ taxAuthorityRegistration: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={residenceId} className="text-sm text-text-muted">
            Код УГД по месту прописки
          </Label>
          <Input
            id={residenceId}
            value={requisites.taxAuthorityResidence}
            onChange={(e) => onChange({ taxAuthorityResidence: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={akimatId} className="text-sm text-text-muted">
            БИН аппарата акима по месту нахождения
          </Label>
          <Input id={akimatId} value={requisites.akimatBin} onChange={(e) => onChange({ akimatBin: e.target.value })} />
        </div>
      </CardContent>
    </Card>
  );
}
