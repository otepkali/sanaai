import { z } from "zod";

const transactionSchema = z.object({
  date: z.string(),
  description: z.string(),
  amount: z.number(),
  counterparty: z.string().nullish(),
});

const categorySchema = z.object({
  name: z.string(),
  account: z.string(),
  amount: z.number(),
  type: z.enum(["income", "expense", "internal"]),
  transactionCount: z.number(),
  transactions: z.array(transactionSchema),
});

const anomalySchema = z.object({
  description: z.string(),
  amount: z.number(),
  severity: z.enum(["low", "medium", "high"]),
});

const summarySchema = z.object({
  totalIncome: z.number(),
  totalExpense: z.number(),
  totalInternal: z.number(),
  balance: z.number(),
  currency: z.string(),
});

export const accountingAnalysisSchema = z.object({
  period: z.string(),
  documentType: z.string(),
  summary: summarySchema,
  categories: z.array(categorySchema),
  anomalies: z.array(anomalySchema),
  recommendations: z.array(z.string()),
});
