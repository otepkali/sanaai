"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Menu, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUser } from "@/lib/hooks/useUser";
import {
  deleteCalculation,
  listCalculations,
  type CalculationRow,
  type CalculationType,
} from "@/lib/supabase/calculations";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<CalculationType, string> = {
  fot: "ФОТ",
  simplified: "Упрощёнка",
  vat: "НДС",
  comparison: "Сравнение режимов",
};

const TYPE_ORDER: CalculationType[] = ["fot", "simplified", "vat", "comparison"];

export interface HistorySidebarProps {
  onRestore: (row: CalculationRow) => void;
  /** Меняется при каждом автосохранении — сигнал перечитать список */
  refreshSignal: number;
}

export function HistorySidebar({ onRestore, refreshSignal }: HistorySidebarProps) {
  const { user } = useUser();
  const [rows, setRows] = useState<CalculationRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenOnMobile, setIsOpenOnMobile] = useState(false);

  const reload = useCallback(() => {
    setIsLoading(true);
    const fetchPromise = user ? listCalculations() : Promise.resolve<CalculationRow[]>([]);
    fetchPromise
      .then(setRows)
      .catch((error) => console.error("Не удалось загрузить историю расчётов", error))
      .finally(() => setIsLoading(false));
  }, [user]);

  useEffect(() => {
    // Отложено на микрозадачу, чтобы reload (вызывающий setState) не считался
    // прямым синхронным вызовом из тела эффекта — см. useUser.ts для того же приёма.
    Promise.resolve().then(() => reload());
  }, [reload, refreshSignal]);

  async function handleDelete(id: string) {
    try {
      await deleteCalculation(id);
      setRows((prev) => prev.filter((row) => row.id !== id));
    } catch (error) {
      console.error("Не удалось удалить расчёт", error);
    }
  }

  if (!user) return null;

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    items: rows.filter((row) => row.type === type),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-40 rounded-full shadow-soft lg:hidden"
        onClick={() => setIsOpenOnMobile(true)}
        aria-label="Открыть историю расчётов"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {isOpenOnMobile ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsOpenOnMobile(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 shrink-0 overflow-y-auto border-r border-border bg-background p-4 transition-transform duration-200 lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0",
          isOpenOnMobile ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">История расчётов</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 lg:hidden"
            onClick={() => setIsOpenOnMobile(false)}
            aria-label="Закрыть историю"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8 text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : grouped.length === 0 ? (
          <p className="text-xs text-text-muted">
            Здесь появятся ваши расчёты — они сохраняются автоматически.
          </p>
        ) : (
          <div className="space-y-4">
            {grouped.map((group) => (
              <div key={group.type}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  {TYPE_LABELS[group.type]}
                </p>
                <ul className="space-y-1">
                  {group.items.map((row) => (
                    <li key={row.id} className="group flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          onRestore(row);
                          setIsOpenOnMobile(false);
                        }}
                        className="flex-1 truncate rounded-lg px-2 py-1.5 text-left text-sm text-text hover:bg-surface-tint"
                      >
                        {row.title ?? TYPE_LABELS[row.type]}
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-text-muted opacity-0 hover:text-danger group-hover:opacity-100"
                            aria-label="Удалить расчёт"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Удалить расчёт?</AlertDialogTitle>
                            <AlertDialogDescription>
                              «{row.title}» будет удалён без возможности восстановления.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(row.id)}>
                              Удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </aside>
    </>
  );
}
