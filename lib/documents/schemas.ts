import { z } from "zod";

export const avrItemSchema = z.object({
  name: z.string(),
  reportInfo: z.string(),
  unit: z.string(),
  quantity: z.number(),
  price: z.number(),
});

export const avrDataSchema = z.object({
  documentNumber: z.string(),
  documentDate: z.string(),
  periodFrom: z.string(),
  periodTo: z.string(),
  customerName: z.string(),
  customerBinIin: z.string(),
  executorName: z.string(),
  contractNumber: z.string(),
  contractDate: z.string(),
  reservesInfo: z.string(),
  attachmentPages: z.string(),
  items: z.array(avrItemSchema).min(1, "Добавьте хотя бы одну позицию"),
});

export const poaAssetItemSchema = z.object({
  name: z.string(),
  unit: z.string(),
  quantityInWords: z.string(),
});

export const poaDataSchema = z.object({
  poaNumber: z.string(),
  issueDate: z.string(),
  validUntilRecipient: z.string(),
  validUntilPayer: z.string(),
  bankAccount: z.string(),
  bankName: z.string(),
  issuedToPosition: z.string(),
  issuedToName: z.string(),
  idDocumentSeries: z.string(),
  idDocumentNumber: z.string(),
  idDocumentDate: z.string(),
  idDocumentIssuedBy: z.string(),
  supplierName: z.string(),
  documentBasis: z.string(),
  items: z.array(poaAssetItemSchema).min(1, "Добавьте хотя бы один актив"),
});

export const waybillItemSchema = z.object({
  name: z.string(),
  nomenclatureNumber: z.string(),
  unit: z.string(),
  quantityToRelease: z.number(),
  quantityReleased: z.number(),
  price: z.number(),
  sumWithVat: z.number(),
  vatSum: z.number(),
});

export const waybillDataSchema = z.object({
  documentNumber: z.string(),
  documentDate: z.string(),
  senderName: z.string(),
  recipientName: z.string(),
  responsiblePerson: z.string(),
  transportOrganization: z.string(),
  transportDocument: z.string(),
  items: z.array(waybillItemSchema).min(1, "Добавьте хотя бы одну позицию"),
  poaNumber: z.string(),
  poaDate: z.string(),
  poaIssuedTo: z.string(),
});

export const payrollSheetEmployeeSchema = z.object({
  fullName: z.string(),
  personnelNumber: z.string(),
  category: z.string(),
  position: z.string(),
  workConditions: z.string(),
  tariffRate: z.number().min(0),
  hourlyRate: z.number().min(0),
  daysWorked: z.number().min(0),
  hoursWorked: z.number().min(0),
  bonus: z.number().min(0),
  sickLeave: z.number().min(0),
  advance: z.number().min(0),
  birthDate: z.string(),
  familyStatus: z.string(),
  note: z.string(),
});

export const payrollSheetDataSchema = z.object({
  period: z.string(),
  department: z.string(),
  employees: z.array(payrollSheetEmployeeSchema).min(1, "Добавьте хотя бы одного сотрудника"),
});

export const generateDocumentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("avr"), data: avrDataSchema }),
  z.object({ type: z.literal("poa"), data: poaDataSchema }),
  z.object({ type: z.literal("waybill"), data: waybillDataSchema }),
  z.object({ type: z.literal("payroll"), data: payrollSheetDataSchema }),
]);
