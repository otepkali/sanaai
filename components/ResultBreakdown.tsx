import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTenge } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface BreakdownRow {
  label: string;
  value: number;
  hint?: string;
  tone?: "default" | "muted" | "success" | "warning" | "danger";
  bold?: boolean;
}

export interface BreakdownHighlight {
  label: string;
  value: number;
  sublabel?: string;
}

export interface ResultBreakdownProps {
  title?: string;
  highlights: BreakdownHighlight[];
  rows: BreakdownRow[];
  badge?: { text: string; tone: "warning" | "danger" | "success" };
}

const TONE_TEXT: Record<NonNullable<BreakdownRow["tone"]>, string> = {
  default: "text-text",
  muted: "text-text-muted",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

const BADGE_CLASS: Record<NonNullable<ResultBreakdownProps["badge"]>["tone"], string> = {
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-danger/10 text-danger border-danger/30",
  success: "bg-success/10 text-success border-success/30",
};

export function ResultBreakdown({ title, highlights, rows, badge }: ResultBreakdownProps) {
  return (
    <Card className="rounded-2xl border-border p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {title ? <h3 className="text-sm font-medium text-text-muted">{title}</h3> : <span />}
        {badge ? (
          <Badge variant="outline" className={cn("rounded-full px-3 py-1", BADGE_CLASS[badge.tone])}>
            {badge.text}
          </Badge>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-3 grid gap-3",
          highlights.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
        )}
      >
        {highlights.map((h) => (
          <div
            key={h.label}
            className="rounded-xl bg-primary-bg px-4 py-4 sm:px-5 sm:py-5"
          >
            <p className="text-sm text-text-muted">{h.label}</p>
            <p className="font-tabular mt-1 text-2xl font-semibold text-primary sm:text-3xl">
              {formatTenge(h.value)}
            </p>
            {h.sublabel ? (
              <p className="mt-1 text-xs text-text-muted">{h.sublabel}</p>
            ) : null}
          </div>
        ))}
      </div>

      <Table className="mt-5">
        <TableHeader>
          <TableRow>
            <TableHead className="text-text-muted">Статья</TableHead>
            <TableHead className="text-right text-text-muted">Сумма</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.label}>
              <TableCell
                className={cn(
                  row.bold ? "font-medium text-text" : "text-text",
                  row.tone && row.tone !== "default" && TONE_TEXT[row.tone]
                )}
              >
                {row.label}
                {row.hint ? (
                  <span className="mt-0.5 block text-xs font-normal text-text-muted">
                    {row.hint}
                  </span>
                ) : null}
              </TableCell>
              <TableCell
                className={cn(
                  "font-tabular text-right",
                  row.bold ? "font-semibold" : "font-normal",
                  TONE_TEXT[row.tone ?? "default"]
                )}
              >
                {formatTenge(row.value)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
