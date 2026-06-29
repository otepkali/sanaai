"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/hooks/useUser";
import { getRequisites, upsertRequisites, uploadCompanyFile } from "@/lib/supabase/requisites";
import { EMPTY_REQUISITES, type CompanyRequisites } from "@/lib/documents/types";
import { CompanyInfoCard } from "@/components/requisites/CompanyInfoCard";
import { OwnerInfoCard } from "@/components/requisites/OwnerInfoCard";
import { LeadershipCard } from "@/components/requisites/LeadershipCard";
import { AddressesCard } from "@/components/requisites/AddressesCard";
import { TaxAuthorityCard } from "@/components/requisites/TaxAuthorityCard";
import { RegistrationDocumentCard } from "@/components/requisites/RegistrationDocumentCard";
import { BankAccountsCard } from "@/components/requisites/BankAccountsCard";
import { WarehousesCard } from "@/components/requisites/WarehousesCard";
import { CashRegistersCard } from "@/components/requisites/CashRegistersCard";
import { SignersSection } from "@/components/requisites/SignersSection";

export function RequisitesForm() {
  const { user } = useUser();
  const [requisites, setRequisites] = useState<CompanyRequisites>(EMPTY_REQUISITES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [uploadingKind, setUploadingKind] = useState<"signature" | "stamp" | "logo" | null>(null);
  const [uploadErrors, setUploadErrors] = useState<{ signature: string | null; stamp: string | null; logo: string | null }>({
    signature: null,
    stamp: null,
    logo: null,
  });

  useEffect(() => {
    if (!user) return;
    getRequisites()
      .then((data) => {
        if (data) setRequisites(data);
      })
      .catch((error) => console.error("Не удалось загрузить реквизиты", error))
      .finally(() => setIsLoading(false));
  }, [user]);

  function patch(fields: Partial<CompanyRequisites>) {
    setRequisites((prev) => ({ ...prev, ...fields }));
  }

  async function persistNow(fields: Partial<CompanyRequisites>) {
    if (!user) return;
    const next = { ...requisites, ...fields };
    setRequisites(next);
    await upsertRequisites(user.id, next);
  }

  async function handleSave() {
    if (!user) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await upsertRequisites(user.id, requisites);
      setSaveMessage("Реквизиты сохранены");
    } catch (error) {
      console.error("Не удалось сохранить реквизиты", error);
      setSaveMessage("Не удалось сохранить реквизиты");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpload(kind: "signature" | "stamp" | "logo", file: File) {
    if (!user) return;
    setUploadingKind(kind);
    setUploadErrors((prev) => ({ ...prev, [kind]: null }));
    try {
      const path = await uploadCompanyFile(user.id, kind, file);
      if (kind === "signature") {
        await persistNow({ signaturePath: path });
      } else if (kind === "stamp") {
        await persistNow({ stampPath: path });
      } else {
        await persistNow({ logoPath: path });
      }
    } catch (error) {
      console.error("Не удалось загрузить файл", error);
      const description = error instanceof Error ? error.message : "неизвестная ошибка";
      setUploadErrors((prev) => ({ ...prev, [kind]: `Не удалось загрузить файл: ${description}` }));
    } finally {
      setUploadingKind(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12 text-text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <CompanyInfoCard
          requisites={requisites}
          onChange={patch}
          onUploadLogo={(file) => handleUpload("logo", file)}
          isUploadingLogo={uploadingKind === "logo"}
          logoError={uploadErrors.logo}
        />
        {requisites.isIndividualEntrepreneur ? <OwnerInfoCard requisites={requisites} onChange={patch} /> : null}
        <LeadershipCard
          requisites={requisites}
          onChange={patch}
          onUploadSignature={(file) => handleUpload("signature", file)}
          isUploadingSignature={uploadingKind === "signature"}
          signatureError={uploadErrors.signature}
        />
        <AddressesCard />
        <TaxAuthorityCard requisites={requisites} onChange={patch} />
        <RegistrationDocumentCard
          requisites={requisites}
          onChange={patch}
          onDelete={() =>
            persistNow({ registrationCertificateNumber: "", registrationCertificateDate: null })
          }
        />
        <BankAccountsCard requisites={requisites} onChange={patch} />
        <WarehousesCard requisites={requisites} onChange={patch} />
        <CashRegistersCard />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Сохранить
        </Button>
        {saveMessage ? <span className="text-sm text-text-muted">{saveMessage}</span> : null}
      </div>

      <SignersSection
        requisites={requisites}
        onUploadStamp={(file) => handleUpload("stamp", file)}
        onDeleteStamp={() => persistNow({ stampPath: null })}
        isUploadingStamp={uploadingKind === "stamp"}
        stampError={uploadErrors.stamp}
      />
    </div>
  );
}
