export type ReportType = "fot" | "simplified" | "vat" | "comparison";

export interface ReportRow {
  label: string;
  /** Уже отформатированное значение (например, «300 000 ₸» или «ТОО на ОУР») */
  value: string;
  bold?: boolean;
}

export interface ReportTableColumn {
  label: string;
  /** Относительная ширина колонки (flex-basis), по умолчанию 1 */
  flex?: number;
  align?: "left" | "right";
}

export interface ReportTable {
  columns: ReportTableColumn[];
  /** Каждая строка — массив уже отформатированных ячеек, в порядке columns */
  rows: string[][];
  /** Индексы строк (с 0), которые нужно выделить жирным — например, итоговые */
  boldRowIndexes?: number[];
}

export interface ReportData {
  type: ReportType;
  title: string;
  /** Дата формирования отчёта, ISO ("2026-06-23") */
  date: string;
  inputs: ReportRow[];
  rows: ReportRow[];
  /** Когда задано — рендерится как широкая горизонтальная таблица вместо построчного списка rows */
  table?: ReportTable;
  /** Ориентация страницы PDF, по умолчанию portrait */
  orientation?: "portrait" | "landscape";
}
