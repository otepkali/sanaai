"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/hooks/useUser";
import { getCashRegisters, upsertCashRegister, deleteCashRegister } from "@/lib/supabase/requisites";
import type { CompanyCashRegister } from "@/lib/documents/types";

export function CashRegistersCard() {
  const { user } = useUser();
  const [registers, setRegisters] = useState<CompanyCashRegister[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getCashRegisters()
      .then(setRegisters)
      .finally(() => setIsLoading(false));
  }, [user]);

  function patchLocal(id: string, fields: Partial<CompanyCashRegister>) {
    setRegisters((prev) => prev.map((r) => (r.id === id ? { ...r, ...fields } : r)));
  }

  async function persist(register: CompanyCashRegister) {
    if (!user) return;
    const saved = await upsertCashRegister(user.id, register);
    setRegisters((prev) => prev.map((r) => (r.id === register.id ? saved : r)));
  }

  function handleAdd() {
    const newRegister: CompanyCashRegister = {
      id: crypto.randomUUID(),
      name: registers.length === 0 ? "Основная касса" : "",
      cashierName: "",
      address: "",
      sortOrder: registers.length,
    };
    setRegisters((prev) => [...prev, newRegister]);
  }

  async function handleDelete(id: string) {
    setRegisters((prev) => prev.filter((r) => r.id !== id));
    await deleteCashRegister(id);
  }

  return (
    <Card className="rounded-2xl border-border shadow-soft">
      <CardHeader>
        <CardTitle>Кассы</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        ) : (
          registers.map((register) => (
            <div key={register.id} className="space-y-2 rounded-xl border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <Input
                  value={register.name}
                  onChange={(e) => patchLocal(register.id, { name: e.target.value })}
                  onBlur={() => persist(register)}
                  placeholder="Название кассы"
                  className="h-8 border-none bg-transparent p-0 text-sm font-medium text-success shadow-none"
                />
                <button
                  type="button"
                  onClick={() => handleDelete(register.id)}
                  className="text-text-muted transition-colors hover:text-danger"
                  aria-label="Удалить кассу"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-text-muted">Кассир</Label>
                <Input
                  value={register.cashierName}
                  onChange={(e) => patchLocal(register.id, { cashierName: e.target.value })}
                  onBlur={() => persist(register)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-text-muted">Адрес</Label>
                <Input
                  value={register.address}
                  onChange={(e) => patchLocal(register.id, { address: e.target.value })}
                  onBlur={() => persist(register)}
                />
              </div>
            </div>
          ))
        )}

        <Button type="button" variant="ghost" size="sm" className="gap-2 text-primary" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          Новая касса
        </Button>
      </CardContent>
    </Card>
  );
}
