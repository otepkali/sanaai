import { z } from "zod";

export const payrollFormSchema = z.object({
  grossSalary: z
    .number()
    .min(0, "Оклад не может быть отрицательным")
    .max(1_000_000_000, "Слишком большое значение"),
  mode: z.enum(["too_our", "ip"]),
  applyStandardDeduction: z.boolean(),
  benefitCategory: z.enum(["none", "pensioner", "disabled", "student"]),
  bornBeforeJan1975: z.boolean(),
});

export type PayrollFormValues = z.infer<typeof payrollFormSchema>;

export const simplifiedFormSchema = z.object({
  halfYearIncome: z.number().min(0, "Доход не может быть отрицательным").max(1_000_000_000_000),
  regionId: z.string(),
  employeeCount: z.number().int().min(0, "Не может быть отрицательным").max(100_000),
  employeesHalfYearPayroll: z.number().min(0, "Не может быть отрицательным").max(1_000_000_000_000),
});

export type SimplifiedFormValues = z.infer<typeof simplifiedFormSchema>;

export const vatFormSchema = z.object({
  amount: z.number().min(0, "Сумма не может быть отрицательной").max(1_000_000_000_000),
  mode: z.enum(["exclusive", "inclusive"]),
});

export type VatFormValues = z.infer<typeof vatFormSchema>;

export const vatThresholdFormSchema = z.object({
  turnover: z.number().min(0, "Оборот не может быть отрицательным").max(1_000_000_000_000),
});

export type VatThresholdFormValues = z.infer<typeof vatThresholdFormSchema>;

export const compareFormSchema = z.object({
  annualRevenue: z.number().min(0, "Оборот не может быть отрицательным").max(1_000_000_000_000),
  annualExpenses: z.number().min(0, "Расходы не могут быть отрицательными").max(1_000_000_000_000),
  annualPayroll: z.number().min(0, "ФОТ не может быть отрицательным").max(1_000_000_000_000),
});

export type CompareFormValues = z.infer<typeof compareFormSchema>;

export const invoiceLineItemSchema = z.object({
  name: z.string().min(1, "Укажите наименование"),
  unit: z.string().min(1, "Укажите единицу измерения"),
  quantity: z.number().min(0, "Не может быть отрицательным").max(1_000_000),
  unitPrice: z.number().min(0, "Не может быть отрицательной").max(1_000_000_000_000),
});

export const invoiceFormSchema = z.object({
  items: z.array(invoiceLineItemSchema).min(1, "Добавьте хотя бы одну позицию"),
  isVatPayer: z.boolean(),
  vatMode: z.enum(["exclusive", "inclusive"]),
  entityType: z.enum(["too", "ip"]),
  expenseSharePercent: z.number().min(0).max(100),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
