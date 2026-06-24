export type DocumentType =
  | "bank_statement"
  | "turnover_balance_1c"
  | "inventory_1c"
  | "payment_orders";

export const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: "bank_statement", label: "Банковская выписка (Halyk, Kaspi, Jusan, ВТБ)" },
  { value: "turnover_balance_1c", label: "Оборотно-сальдовая ведомость из 1С" },
  { value: "inventory_1c", label: "Выгрузка ТМЗ из 1С" },
  { value: "payment_orders", label: "Платёжные поручения" },
];

export type TransactionType = "income" | "expense" | "internal";
export type AnomalySeverity = "low" | "medium" | "high";

export interface AccountingTransaction {
  date: string;
  description: string;
  amount: number;
  counterparty?: string | null;
}

export interface AccountingCategory {
  name: string;
  account: string;
  amount: number;
  type: TransactionType;
  transactionCount: number;
  transactions: AccountingTransaction[];
}

export interface AccountingAnomaly {
  description: string;
  amount: number;
  severity: AnomalySeverity;
}

export interface AccountingSummary {
  totalIncome: number;
  totalExpense: number;
  totalInternal: number;
  balance: number;
  currency: string;
}

export interface AccountingAnalysisResult {
  period: string;
  documentType: string;
  summary: AccountingSummary;
  categories: AccountingCategory[];
  anomalies: AccountingAnomaly[];
  recommendations: string[];
}
