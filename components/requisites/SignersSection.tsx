"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileSlot } from "@/components/requisites/FileSlot";
import { useUser } from "@/lib/hooks/useUser";
import { getSigners, upsertSigner, deleteSigner, uploadSignerFile } from "@/lib/supabase/requisites";
import { SIGNER_ROLE_LABELS, type CompanyRequisites, type CompanySigner, type CompanySignerRole } from "@/lib/documents/types";

const ROLES: CompanySignerRole[] = [
  "individual_entrepreneur",
  "chief_accountant",
  "goods_release",
  "invoice_for_director",
  "invoice_for_accountant",
];

export function SignersSection({
  requisites,
  onUploadStamp,
  onDeleteStamp,
  isUploadingStamp,
  stampError,
}: {
  requisites: CompanyRequisites;
  onUploadStamp: (file: File) => void;
  onDeleteStamp: () => void;
  isUploadingStamp: boolean;
  stampError: string | null;
}) {
  const { user } = useUser();
  const [signers, setSigners] = useState<CompanySigner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getSigners()
      .then(setSigners)
      .finally(() => setIsLoading(false));
  }, [user]);

  function patchLocal(id: string, fields: Partial<CompanySigner>) {
    setSigners((prev) => prev.map((s) => (s.id === id ? { ...s, ...fields } : s)));
  }

  async function persist(signer: CompanySigner) {
    if (!user) return;
    const saved = await upsertSigner(user.id, signer);
    setSigners((prev) => prev.map((s) => (s.id === signer.id ? saved : s)));
  }

  function handleAdd(role: CompanySignerRole) {
    const newSigner: CompanySigner = {
      id: crypto.randomUUID(),
      role,
      fullName: "",
      signaturePath: null,
      sortOrder: signers.filter((s) => s.role === role).length,
    };
    setSigners((prev) => [...prev, newSigner]);
  }

  async function handleDelete(id: string) {
    setSigners((prev) => prev.filter((s) => s.id !== id));
    await deleteSigner(id);
  }

  async function handleUploadSignature(signer: CompanySigner, file: File) {
    if (!user) return;
    setUploadingId(signer.id);
    try {
      const path = await uploadSignerFile(user.id, signer.id, file);
      const next = { ...signer, signaturePath: path };
      patchLocal(signer.id, next);
      await persist(next);
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text">Подписи и печати</h2>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Печать организации</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-text-muted">{requisites.companyName || "—"}</p>
            <FileSlot
              label=""
              path={requisites.stampPath}
              onUpload={onUploadStamp}
              isUploading={isUploadingStamp}
              error={stampError}
            />
            {requisites.stampPath ? (
              <button
                type="button"
                onClick={onDeleteStamp}
                className="flex items-center gap-1.5 text-sm text-danger transition-colors hover:text-danger/80"
              >
                Удалить печать
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </CardContent>
        </Card>

        {isLoading
          ? null
          : ROLES.map((role) => (
              <Card key={role} className="rounded-2xl border-border shadow-soft">
                <CardHeader>
                  <CardTitle className="text-base">{SIGNER_ROLE_LABELS[role]}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {signers
                    .filter((s) => s.role === role)
                    .map((signer) => (
                      <div key={signer.id} className="space-y-2 rounded-xl border border-border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <Input
                            value={signer.fullName}
                            onChange={(e) => patchLocal(signer.id, { fullName: e.target.value })}
                            onBlur={() => persist(signer)}
                            placeholder="ФИО подписанта"
                          />
                          <button
                            type="button"
                            onClick={() => handleDelete(signer.id)}
                            className="text-text-muted transition-colors hover:text-danger"
                            aria-label="Удалить подписанта"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <FileSlot
                          label="Подпись"
                          path={signer.signaturePath}
                          onUpload={(file) => handleUploadSignature(signer, file)}
                          isUploading={uploadingId === signer.id}
                          error={null}
                        />
                      </div>
                    ))}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-primary"
                    onClick={() => handleAdd(role)}
                  >
                    <Plus className="h-4 w-4" />
                    Добавить подписанта
                  </Button>
                </CardContent>
              </Card>
            ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
        </div>
      ) : null}
    </div>
  );
}
