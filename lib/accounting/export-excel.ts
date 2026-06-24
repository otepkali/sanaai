import * as XLSX from "xlsx";
import type { AccountingAnalysisResult } from "./types";

const TYPE_LABELS: Record<string, string> = {
  income: "Доход",
  expense: "Расход",
  internal: "Внутренний перевод",
};

export function exportAccountingResultToExcel(result: AccountingAnalysisResult): void {
  const workbook = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.json_to_sheet([
    { Показатель: "Период", Значение: result.period },
    { Показатель: "Тип документа", Значение: result.documentType },
    { Показатель: "Итого поступлений", Значение: result.summary.totalIncome },
    { Показатель: "Итого расходов", Значение: result.summary.totalExpense },
    { Показатель: "Внутренние переводы", Значение: result.summary.totalInternal },
    { Показатель: "Баланс", Значение: result.summary.balance },
  ]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Итоги");

  const categoriesSheet = XLSX.utils.json_to_sheet(
    result.categories.map((category) => ({
      Категория: category.name,
      Счёт: category.account,
      Тип: TYPE_LABELS[category.type] ?? category.type,
      Транзакций: category.transactionCount,
      Сумма: category.amount,
    }))
  );
  XLSX.utils.book_append_sheet(workbook, categoriesSheet, "Категории");

  const transactionsSheet = XLSX.utils.json_to_sheet(
    result.categories.flatMap((category) =>
      category.transactions.map((transaction) => ({
        Категория: category.name,
        Счёт: category.account,
        Дата: transaction.date,
        Описание: transaction.description,
        Контрагент: transaction.counterparty ?? "",
        Сумма: transaction.amount,
      }))
    )
  );
  XLSX.utils.book_append_sheet(workbook, transactionsSheet, "Транзакции");

  if (result.anomalies.length > 0) {
    const anomaliesSheet = XLSX.utils.json_to_sheet(
      result.anomalies.map((anomaly) => ({
        Описание: anomaly.description,
        Сумма: anomaly.amount,
        Критичность: anomaly.severity,
      }))
    );
    XLSX.utils.book_append_sheet(workbook, anomaliesSheet, "Аномалии");
  }

  const safePeriod = result.period.replace(/[\\/:*?"<>|]/g, "_");
  XLSX.writeFile(workbook, `Учёт_${safePeriod}.xlsx`);
}
