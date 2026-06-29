"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/lib/hooks/useUser";
import { getAddresses, upsertAddress, deleteAddress } from "@/lib/supabase/requisites";
import type { CompanyAddress, CompanyAddressType } from "@/lib/documents/types";

const TYPE_LABELS: Record<CompanyAddressType, string> = {
  legal: "Юридический адрес",
  actual: "Фактический адрес",
  other: "Адрес",
};

export function AddressesCard() {
  const { user } = useUser();
  const [addresses, setAddresses] = useState<CompanyAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getAddresses()
      .then(setAddresses)
      .finally(() => setIsLoading(false));
  }, [user]);

  function patchLocal(id: string, fields: Partial<CompanyAddress>) {
    setAddresses((prev) => prev.map((a) => (a.id === id ? { ...a, ...fields } : a)));
  }

  async function persist(address: CompanyAddress) {
    if (!user) return;
    const saved = await upsertAddress(user.id, address);
    setAddresses((prev) => prev.map((a) => (a.id === address.id ? saved : a)));
  }

  function handleAdd() {
    const newAddress: CompanyAddress = {
      id: crypto.randomUUID(),
      type: "other",
      address: "",
      sortOrder: addresses.length,
    };
    setAddresses((prev) => [...prev, newAddress]);
  }

  async function handleDelete(id: string) {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    await deleteAddress(id);
  }

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border shadow-soft">
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border shadow-soft">
      <CardHeader>
        <CardTitle>Адреса</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {addresses.map((address) => (
          <div key={address.id} className="space-y-2 rounded-xl border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <Select
                value={address.type}
                onValueChange={(v) => {
                  const next = { ...address, type: v as CompanyAddressType };
                  patchLocal(address.id, next);
                  persist(next);
                }}
              >
                <SelectTrigger className="h-8 w-auto border-none bg-transparent p-0 text-sm font-medium text-text-muted shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => handleDelete(address.id)}
                className="text-text-muted transition-colors hover:text-danger"
                aria-label="Удалить адрес"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <Input
              value={address.address}
              onChange={(e) => patchLocal(address.id, { address: e.target.value })}
              onBlur={() => persist(address)}
              placeholder="Город, улица, дом"
            />
          </div>
        ))}

        <Button type="button" variant="ghost" size="sm" className="gap-2 text-primary" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          Добавить адрес
        </Button>
      </CardContent>
    </Card>
  );
}
