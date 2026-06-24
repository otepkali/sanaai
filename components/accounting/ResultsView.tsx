"use client";

import { Fragment } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, Download, Loader2, RotateCcw, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportAccountingResultToExcel } from "@/lib/accounting/export-excel";
import type { AccountingAnalysisResult } from "@/lib/accounting/types";
import { formatTenge } from "@/lib/format";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  income: "Доход",
  expense: "Расход",
  internal: "Внутренний перевод",
};

const TYPE_TEXT_CLASS: Record<string, string> = {
  income: "text-success",
  expense: "text-danger",
  internal: "text-text-muted",
};

const SEVERITY_STYLES: Record<string, string> = {
  low: "border-yellow-300 bg-yellow-50 text-yellow-800",
  medium: "border-warning/40 bg-warning/10 text-warning",
  high: "border-danger/40 bg-danger/10 text-danger",
};

const SEVERITY_LABELS: Record<string, string> = {
  low: "Низкая",
  medium: "Средняя",
  high: "Высокая",
};

export interface ResultsViewProps {
  result: AccountingAnalysisResult;
  expandedCategory: number | null;
  onToggleCategory: (index: number) => void;
  onReset: () => void;
  onSave: () => void;
  isSaving: boolean;
  saveMessage: string | null;
}

export function ResultsView({
  result,
  expandedCategory,
  onToggleCategory,
  onReset,
  onSave,
  isSaving,
  saveMessage,
}: ResultsViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border-success/30 bg-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Итого поступлений</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-tabular text-2xl font-semibold text-success">
              {formatTenge(result.summary.totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-danger/30 bg-danger/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Итого расходов</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-tabular text-2xl font-semibold text-danger">
              {formatTenge(result.summary.totalExpense)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Баланс</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-tabular text-2xl font-semibold text-blue-700">
              {formatTenge(result.summary.balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader>
          <CardTitle>Категории</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Категория</TableHead>
                <TableHead>Счёт РК</TableHead>
                <TableHead className="text-right">Транзакций</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
                <TableHead>Тип</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.categories.map((category, index) => {
                const isExpanded = expandedCategory === index;
                return (
                  <Fragment key={`${category.account}-${index}`}>
                    <TableRow className="cursor-pointer" onClick={() => onToggleCategory(index)}>
                      <TableCell>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-text-muted" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-text-muted" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="font-tabular text-text-muted">{category.account}</TableCell>
                      <TableCell className="text-right font-tabular">{category.transactionCount}</TableCell>
                      <TableCell
                        className={cn("text-right font-tabular font-medium", TYPE_TEXT_CLASS[category.type])}
                      >
                        {formatTenge(category.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={TYPE_TEXT_CLASS[category.type]}>
                          {TYPE_LABELS[category.type] ?? category.type}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {isExpanded ? (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-surface-tint/40 p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Дата</TableHead>
                                <TableHead>Описание</TableHead>
                                <TableHead>Контрагент</TableHead>
                                <TableHead className="text-right">Сумма</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {category.transactions.map((transaction, transactionIndex) => (
                                <TableRow key={transactionIndex}>
                                  <TableCell className="whitespace-nowrap">{transaction.date}</TableCell>
                                  <TableCell>{transaction.description}</TableCell>
                                  <TableCell>{transaction.counterparty ?? "—"}</TableCell>
                                  <TableCell
                                    className={cn(
                                      "text-right font-tabular",
                                      TYPE_TEXT_CLASS[category.type]
                                    )}
                                  >
                                    {formatTenge(transaction.amount)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {result.anomalies.length > 0 ? (
        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader>
            <CardTitle>Аномалии</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.anomalies.map((anomaly, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 text-sm",
                  SEVERITY_STYLES[anomaly.severity] ?? SEVERITY_STYLES.medium
                )}
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="flex-1">
                  <p>{anomaly.description}</p>
                  <p className="mt-1 font-tabular font-medium">{formatTenge(anomaly.amount)}</p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {SEVERITY_LABELS[anomaly.severity] ?? anomaly.severity}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {result.recommendations.length > 0 ? (
        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader>
            <CardTitle>Рекомендации ИИ</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-text">
              {result.recommendations.map((recommendation, index) => (
                <li key={index}>{recommendation}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => exportAccountingResultToExcel(result)} className="gap-2">
          <Download className="h-4 w-4" />
          Экспорт в Excel
        </Button>
        <Button variant="outline" onClick={onReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Новый анализ
        </Button>
        <Button onClick={onSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Сохранить в историю
        </Button>
        {saveMessage ? <span className="text-sm text-text-muted">{saveMessage}</span> : null}
      </div>
    </div>
  );
}
