"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/lib/hooks/useUser";
import { getWarehouses, upsertWarehouse, deleteWarehouse } from "@/lib/supabase/requisites";
import type { CompanyRequisites, CompanyWarehouse } from "@/lib/documents/types";

export function WarehousesCard({
  requisites,
  onChange,
}: {
  requisites: CompanyRequisites;
  onChange: (fields: Partial<CompanyRequisites>) => void;
}) {
  const { user } = useUser();
  const [warehouses, setWarehouses] = useState<CompanyWarehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getWarehouses()
      .then(setWarehouses)
      .finally(() => setIsLoading(false));
  }, [user]);

  function patchLocal(id: string, fields: Partial<CompanyWarehouse>) {
    setWarehouses((prev) => prev.map((w) => (w.id === id ? { ...w, ...fields } : w)));
  }

  async function persist(warehouse: CompanyWarehouse) {
    if (!user) return;
    const saved = await upsertWarehouse(user.id, warehouse);
    setWarehouses((prev) => prev.map((w) => (w.id === warehouse.id ? saved : w)));
  }

  function handleAdd() {
    const newWarehouse: CompanyWarehouse = {
      id: crypto.randomUUID(),
      name: warehouses.length === 0 ? "Основной склад" : "",
      address: "",
      sortOrder: warehouses.length,
    };
    setWarehouses((prev) => [...prev, newWarehouse]);
  }

  async function handleDelete(id: string) {
    setWarehouses((prev) => prev.filter((w) => w.id !== id));
    await deleteWarehouse(id);
  }

  return (
    <Card className="rounded-2xl border-border shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Склады</CardTitle>
        <div className="flex items-center gap-2">
          <Label htmlFor="stock-control" className="text-sm text-text-muted">
            Контроль остатков
          </Label>
          <Switch
            id="stock-control"
            checked={requisites.stockControlEnabled}
            onCheckedChange={(v) => onChange({ stockControlEnabled: v })}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        ) : (
          warehouses.map((warehouse) => (
            <div key={warehouse.id} className="space-y-2 rounded-xl border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <Input
                  value={warehouse.name}
                  onChange={(e) => patchLocal(warehouse.id, { name: e.target.value })}
                  onBlur={() => persist(warehouse)}
                  placeholder="Название склада"
                  className="h-8 border-none bg-transparent p-0 text-sm font-medium text-success shadow-none"
                />
                <button
                  type="button"
                  onClick={() => handleDelete(warehouse.id)}
                  className="text-text-muted transition-colors hover:text-danger"
                  aria-label="Удалить склад"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <Input
                value={warehouse.address}
                onChange={(e) => patchLocal(warehouse.id, { address: e.target.value })}
                onBlur={() => persist(warehouse)}
                placeholder="Адрес"
              />
            </div>
          ))
        )}

        <Button type="button" variant="ghost" size="sm" className="gap-2 text-primary" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          Новый склад
        </Button>
      </CardContent>
    </Card>
  );
}
