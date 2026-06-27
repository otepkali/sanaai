"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/lib/hooks/useUser";
import {
  getRequisites,
  upsertRequisites,
  uploadCompanyFile,
  getCompanyFileSignedUrl,
} from "@/lib/supabase/requisites";
import { EMPTY_REQUISITES, type CompanyRequisites } from "@/lib/documents/types";

function FileSlot({
  label,
  path,
  onUpload,
  isUploading,
}: {
  label: string;
  path: string | null;
  onUpload: (file: File) => void;
  isUploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      Promise.resolve().then(() => setPreviewUrl(null));
      return;
    }
    getCompanyFileSignedUrl(path).then(setPreviewUrl);
  }, [path]);

  return (
    <div className="space-y-2">
      <Label className="text-sm text-text-muted">{label}</Label>
      <div className="flex items-center gap-4 rounded-xl border border-border p-3">
        <div className="flex h-16 w-32 items-center justify-center overflow-hidden rounded-lg bg-surface-tint">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- предпросмотр PNG из приватного Storage по подписанной ссылке
            <img src={previewUrl} alt={label} className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-text-muted">Нет файла</span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Загрузить PNG
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
      </div>
    </div>
  );
}

export function RequisitesForm() {
  const { user } = useUser();
  const [requisites, setRequisites] = useState<CompanyRequisites>(EMPTY_REQUISITES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [uploadingKind, setUploadingKind] = useState<"signature" | "stamp" | null>(null);

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

  async function handleUpload(kind: "signature" | "stamp", file: File) {
    if (!user) return;
    setUploadingKind(kind);
    try {
      const path = await uploadCompanyFile(user.id, kind, file);
      patch(kind === "signature" ? { signaturePath: path } : { stampPath: path });
    } catch (error) {
      console.error("Не удалось загрузить файл", error);
    } finally {
      setUploadingKind(null);
    }
  }

  const companyNameId = useId();
  const binIinId = useId();
  const directorNameId = useId();
  const accountantNameId = useId();
  const addressId = useId();
  const bankNameId = useId();
  const iikId = useId();
  const bikId = useId();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12 text-text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader>
          <CardTitle>Реквизиты компании</CardTitle>
          <CardDescription>
            Подставляются автоматически во все бухгалтерские документы — заполните один раз
          </CardDescription>
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
              onCheckedChange={(v) => patch({ isIndividualEntrepreneur: v })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={companyNameId} className="text-sm text-text-muted">
              Наименование организации
            </Label>
            <Input
              id={companyNameId}
              value={requisites.companyName}
              onChange={(e) => patch({ companyName: e.target.value })}
              placeholder='ТОО "Компания"'
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={binIinId} className="text-sm text-text-muted">
              БИН / ИИН
            </Label>
            <Input
              id={binIinId}
              value={requisites.binIin}
              onChange={(e) => patch({ binIin: e.target.value })}
              className="font-tabular"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={directorNameId} className="text-sm text-text-muted">
                Руководитель
              </Label>
              <Input
                id={directorNameId}
                value={requisites.directorName}
                onChange={(e) => patch({ directorName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={accountantNameId} className="text-sm text-text-muted">
                Главный бухгалтер
              </Label>
              <Input
                id={accountantNameId}
                value={requisites.accountantName}
                onChange={(e) => patch({ accountantName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={addressId} className="text-sm text-text-muted">
              Адрес
            </Label>
            <Input
              id={addressId}
              value={requisites.address}
              onChange={(e) => patch({ address: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={bankNameId} className="text-sm text-text-muted">
              Банк
            </Label>
            <Input
              id={bankNameId}
              value={requisites.bankName}
              onChange={(e) => patch({ bankName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={iikId} className="text-sm text-text-muted">
                ИИК
              </Label>
              <Input
                id={iikId}
                value={requisites.iik}
                onChange={(e) => patch({ iik: e.target.value })}
                className="font-tabular"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={bikId} className="text-sm text-text-muted">
                БИК
              </Label>
              <Input id={bikId} value={requisites.bik} onChange={(e) => patch({ bik: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Подпись и печать</CardTitle>
          <CardDescription>PNG с прозрачным фоном — будут вставлены в документы</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileSlot
            label="Подпись руководителя"
            path={requisites.signaturePath}
            onUpload={(file) => handleUpload("signature", file)}
            isUploading={uploadingKind === "signature"}
          />
          <FileSlot
            label="Печать организации"
            path={requisites.stampPath}
            onUpload={(file) => handleUpload("stamp", file)}
            isUploading={uploadingKind === "stamp"}
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Сохранить
        </Button>
        {saveMessage ? <span className="text-sm text-text-muted">{saveMessage}</span> : null}
      </div>
    </div>
  );
}
