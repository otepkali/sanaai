"use client";

import { useEffect, useId, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/hooks/useUser";
import { getBankAccounts, upsertBankAccount, deleteBankAccount } from "@/lib/supabase/requisites";
import type { CompanyBankAccount, CompanyRequisites } from "@/lib/documents/types";

export function BankAccountsCard({
  requisites,
  onChange,
}: {
  requisites: CompanyRequisites;
  onChange: (fields: Partial<CompanyRequisites>) => void;
}) {
  const { user } = useUser();
  const [accounts, setAccounts] = useState<CompanyBankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const bankNameId = useId();
  const ikkId = useId();
  const bikId = useId();
  const currencyId = useId();

  useEffect(() => {
    if (!user) return;
    getBankAccounts()
      .then(setAccounts)
      .finally(() => setIsLoading(false));
  }, [user]);

  function patchLocal(id: string, fields: Partial<CompanyBankAccount>) {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...fields } : a)));
  }

  async function persist(account: CompanyBankAccount) {
    if (!user) return;
    const saved = await upsertBankAccount(user.id, account);
    setAccounts((prev) => prev.map((a) => (a.id === account.id ? saved : a)));
  }

  function handleAdd() {
    const newAccount: CompanyBankAccount = {
      id: crypto.randomUUID(),
      label: "Расчётный счёт",
      accountNumber: "",
      currency: "KZT",
      bik: "",
      bankName: "",
      sortOrder: accounts.length,
    };
    setAccounts((prev) => [...prev, newAccount]);
  }

  async function handleDelete(id: string) {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    await deleteBankAccount(id);
  }

  return (
    <Card className="rounded-2xl border-border shadow-soft">
      <CardHeader>
        <CardTitle>Расчётные счета</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 rounded-xl border border-border p-3">
          <p className="text-sm font-medium text-success">Основной расчётный счёт</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={ikkId} className="text-sm text-text-muted">
                Номер счёта
              </Label>
              <Input id={ikkId} value={requisites.iik} onChange={(e) => onChange({ iik: e.target.value })} className="font-tabular" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={currencyId} className="text-sm text-text-muted">
                Валюта
              </Label>
              <Input id={currencyId} value={requisites.currency} onChange={(e) => onChange({ currency: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={bikId} className="text-sm text-text-muted">
                БИК
              </Label>
              <Input id={bikId} value={requisites.bik} onChange={(e) => onChange({ bik: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={bankNameId} className="text-sm text-text-muted">
                Банк
              </Label>
              <Input id={bankNameId} value={requisites.bankName} onChange={(e) => onChange({ bankName: e.target.value })} />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="space-y-3 rounded-xl border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <Input
                  value={account.label}
                  onChange={(e) => patchLocal(account.id, { label: e.target.value })}
                  onBlur={() => persist(account)}
                  className="h-8 border-none bg-transparent p-0 text-sm font-medium shadow-none"
                />
                <button
                  type="button"
                  onClick={() => handleDelete(account.id)}
                  className="text-text-muted transition-colors hover:text-danger"
                  aria-label="Удалить счёт"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm text-text-muted">Номер счёта</Label>
                  <Input
                    value={account.accountNumber}
                    onChange={(e) => patchLocal(account.id, { accountNumber: e.target.value })}
                    onBlur={() => persist(account)}
                    className="font-tabular"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-text-muted">Валюта</Label>
                  <Input
                    value={account.currency}
                    onChange={(e) => patchLocal(account.id, { currency: e.target.value })}
                    onBlur={() => persist(account)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-text-muted">БИК</Label>
                  <Input
                    value={account.bik}
                    onChange={(e) => patchLocal(account.id, { bik: e.target.value })}
                    onBlur={() => persist(account)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-text-muted">Банк</Label>
                  <Input
                    value={account.bankName}
                    onChange={(e) => patchLocal(account.id, { bankName: e.target.value })}
                    onBlur={() => persist(account)}
                  />
                </div>
              </div>
            </div>
          ))
        )}

        <Button type="button" variant="ghost" size="sm" className="gap-2 text-primary" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          Новый расчётный счёт
        </Button>
      </CardContent>
    </Card>
  );
}
