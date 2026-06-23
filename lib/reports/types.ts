export type ReportType = "fot" | "simplified" | "vat" | "comparison";

export interface ReportRow {
  label: string;
  /** Уже отформатированное значение (например, «300 000 ₸» или «ТОО на ОУР») */
  value: string;
  bold?: boolean;
}

export interface ReportData {
  type: ReportType;
  title: string;
  /** Дата формирования отчёта, ISO ("2026-06-23") */
  date: string;
  inputs: ReportRow[];
  rows: ReportRow[];
}
