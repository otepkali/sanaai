"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { createClient } from "@/lib/supabase/client";
import { hasActiveSubscription, type SubscriptionStatus } from "@/lib/billing/subscription";

interface AdminUserRow {
  user_id: string;
  email: string;
  registered_at: string;
  last_sign_in_at: string | null;
  company_name: string | null;
  bin_iin: string | null;
  status: SubscriptionStatus | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  documents_count: number;
  calculations_count: number;
}

type AccessKind = "none" | "trial" | "active" | "ending" | "expired" | "past_due";

const ACCESS_LABELS: Record<AccessKind, { label: string; className: string }> = {
  none: { label: "Без подписки", className: "bg-surface-tint text-text-muted" },
  trial: { label: "Пробный", className: "bg-primary-bg text-primary" },
  active: { label: "Оплачено", className: "bg-success/10 text-success" },
  ending: { label: "Отменена", className: "bg-warning/10 text-warning" },
  expired: { label: "Истекла", className: "bg-danger/10 text-danger" },
  past_due: { label: "Оплата не прошла", className: "bg-danger/10 text-danger" },
};

const FILTERS: { value: AccessKind | "all"; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "trial", label: "Пробный" },
  { value: "active", label: "Оплачено" },
  { value: "ending", label: "Отменена" },
  { value: "expired", label: "Истекла" },
  { value: "none", label: "Без подписки" },
];

function accessKind(row: AdminUserRow): AccessKind {
  if (!row.status || !row.current_period_end) return "none";
  if (row.status === "past_due") return "past_due";
  const active = hasActiveSubscription({
    status: row.status,
    current_period_end: row.current_period_end,
  } as Parameters<typeof hasActiveSubscription>[0]);
  if (!active) return "expired";
  if (row.cancel_at_period_end) return "ending";
  return row.status === "trialing" ? "trial" : "active";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function AdminUsersClient() {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AccessKind | "all">("all");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [daysByUser, setDaysByUser] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("admin_list_users");
    if (rpcError) {
      setError("Не удалось загрузить пользователей");
      console.error(rpcError);
    } else {
      setRows((data as AdminUserRow[]) ?? []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

  async function runAction(userId: string, fn: "admin_extend_subscription" | "admin_revoke_subscription", days?: number) {
    setBusyUserId(userId);
    setError(null);
    const supabase = createClient();
    const args = fn === "admin_extend_subscription" ? { target_user: userId, days } : { target_user: userId };
    const { error: rpcError } = await supabase.rpc(fn, args);
    if (rpcError) {
      setError("Действие не выполнено: " + rpcError.message);
    } else {
      await load();
    }
    setBusyUserId(null);
  }

  const counts = useMemo(() => {
    const result: Record<AccessKind | "all", number> = {
      all: rows.length,
      none: 0,
      trial: 0,
      active: 0,
      ending: 0,
      expired: 0,
      past_due: 0,
    };
    rows.forEach((row) => {
      result[accessKind(row)] += 1;
    });
    return result;
  }, [rows]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter !== "all" && accessKind(row) !== filter) return false;
      if (!q) return true;
      return [row.email, row.company_name, row.bin_iin].some((v) => v?.toLowerCase().includes(q));
    });
  }, [rows, query, filter]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {(
          [
            ["Всего пользователей", counts.all],
            ["Пробный период", counts.trial],
            ["Оплачено", counts.active],
            ["Отменили", counts.ending],
            ["Истекла / без подписки", counts.expired + counts.none + counts.past_due],
          ] as const
        ).map(([label, value]) => (
          <Card key={label} className="rounded-2xl border-border shadow-soft">
            <CardContent className="p-5">
              <p className="text-xs text-text-muted">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-text">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по почте, компании или БИН/ИИН"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              type="button"
              size="sm"
              variant={filter === f.value ? "default" : "outline"}
              onClick={() => setFilter(f.value)}
            >
              {f.label} ({counts[f.value]})
            </Button>
          ))}
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={load} className="gap-1.5">
          <RefreshCw className="h-4 w-4" />
          Обновить
        </Button>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Card className="rounded-2xl border-border shadow-soft">
        <CardContent className="overflow-x-auto p-0">
          {isLoading ? (
            <div className="flex justify-center py-12 text-text-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Компания</TableHead>
                  <TableHead>Регистрация</TableHead>
                  <TableHead>Последний вход</TableHead>
                  <TableHead>Подписка</TableHead>
                  <TableHead>Доступ до</TableHead>
                  <TableHead className="text-right">Док. / расч.</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-sm text-text-muted">
                      Никого не найдено
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleRows.map((row) => {
                    const kind = accessKind(row);
                    const badge = ACCESS_LABELS[kind];
                    const isBusy = busyUserId === row.user_id;
                    const days = daysByUser[row.user_id] ?? "30";
                    return (
                      <TableRow key={row.user_id}>
                        <TableCell className="font-medium text-text">{row.email}</TableCell>
                        <TableCell className="text-sm text-text-muted">
                          {row.company_name || "—"}
                          {row.bin_iin ? <div className="font-tabular text-xs">{row.bin_iin}</div> : null}
                        </TableCell>
                        <TableCell className="text-sm text-text-muted">{formatDate(row.registered_at)}</TableCell>
                        <TableCell className="text-sm text-text-muted">{formatDate(row.last_sign_in_at)}</TableCell>
                        <TableCell>
                          <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>
                            {badge.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-text-muted">{formatDate(row.current_period_end)}</TableCell>
                        <TableCell className="font-tabular text-right text-sm text-text-muted">
                          {row.documents_count} / {row.calculations_count}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Input
                              type="number"
                              min={1}
                              value={days}
                              onChange={(e) => setDaysByUser((prev) => ({ ...prev, [row.user_id]: e.target.value }))}
                              className="h-8 w-16 font-tabular"
                              aria-label="Количество дней"
                            />
                            <Button
                              type="button"
                              size="sm"
                              disabled={isBusy || !(Number(days) > 0)}
                              onClick={() => runAction(row.user_id, "admin_extend_subscription", Math.floor(Number(days)))}
                              className="whitespace-nowrap"
                            >
                              {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "+ дней"}
                            </Button>
                            {kind === "trial" || kind === "active" || kind === "ending" ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button type="button" size="sm" variant="outline" disabled={isBusy} className="text-danger">
                                    Закрыть
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Закрыть доступ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {row.email} сразу потеряет доступ к документам и истории.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => runAction(row.user_id, "admin_revoke_subscription")}>
                                      Закрыть доступ
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
