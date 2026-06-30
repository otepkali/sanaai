import { z } from "zod";

export const esfItemSchema = z.object({
  originFlag: z.string(),
  name: z.string(),
  tnvedName: z.string(),
  tnvedCode: z.string(),
  unit: z.string(),
  quantity: z.number(),
  price: z.number(),
  sum: z.number(),
  exciseRate: z.string(),
  exciseSum: z.number(),
  turnoverInfo: z.string(),
  vatRate: z.string(),
  vatSum: z.number(),
  sumWithTax: z.number(),
  declarationNumber: z.string(),
  tradePositionNumber: z.string(),
  supplierEsfRegistrationNumber: z.string(),
  additionalData: z.string(),
});

const sectionASchema = z.object({
  registrationNumber: z.string(),
  accountingSystemNumber: z.string(),
  issueDate: z.string(),
  paperIssueDate: z.string(),
  turnoverDate: z.string(),
  isCorrected: z.boolean(),
  correctedDate: z.string(),
  correctedSystemNumber: z.string(),
  correctedRegistrationNumber: z.string(),
  isAdditional: z.boolean(),
  additionalDate: z.string(),
  additionalSystemNumber: z.string(),
  additionalRegistrationNumber: z.string(),
});

const sectionBSchema = z.object({
  binIin: z.string(),
  structuralUnitBin: z.string(),
  reorganizedBin: z.string(),
  name: z.string(),
  participationShare: z.string(),
  address: z.string(),
  vatCertificateSeries: z.string(),
  vatCertificateNumber: z.string(),
  isNonResidentStructuralUnit: z.boolean(),
  category: z.string(),
  participantsCount: z.string(),
  additionalInfo: z.string(),
});

const sectionB1Schema = z.object({
  kbe: z.string(),
  iik: z.string(),
  bik: z.string(),
  bankName: z.string(),
});

const sectionCSchema = z.object({
  binIin: z.string(),
  structuralUnitBin: z.string(),
  reorganizedBin: z.string(),
  name: z.string(),
  participationShare: z.string(),
  address: z.string(),
  countryCode: z.string(),
  additionalInfo: z.string(),
  category: z.string(),
  participantsCount: z.string(),
});

const sectionC1Schema = z.object({
  iik: z.string(),
  productCode: z.string(),
  paymentPurpose: z.string(),
  bik: z.string(),
});

const sectionDSchema = z.object({
  shipperBinIin: z.string(),
  shipperName: z.string(),
  shipperAddress: z.string(),
  consigneeBinIin: z.string(),
  consigneeName: z.string(),
  consigneeAddress: z.string(),
  consigneeCountryCode: z.string(),
});

const sectionESchema = z.object({
  hasContract: z.boolean(),
  noContract: z.boolean(),
  contractNumber: z.string(),
  contractDate: z.string(),
  contractAccountingNumber: z.string(),
  paymentTerms: z.string(),
  dispatchMethod: z.string(),
  poaNumber: z.string(),
  poaDate: z.string(),
  destination: z.string(),
  deliveryTerms: z.string(),
});

const sectionFSchema = z.object({
  documentNumber: z.string(),
  documentDate: z.string(),
  currencyCode: z.string(),
  currencyRate: z.string(),
});

const agentSchema = z.object({
  bin: z.string(),
  name: z.string(),
  address: z.string(),
  documentNumber: z.string(),
  documentDate: z.string(),
});

export const esfDataSchema = z.object({
  sectionA: sectionASchema,
  sectionB: sectionBSchema,
  sectionB1: sectionB1Schema,
  sectionC: sectionCSchema,
  sectionC1: sectionC1Schema.nullable(),
  sectionD: sectionDSchema,
  sectionE: sectionESchema,
  sectionF: sectionFSchema,
  items: z.array(esfItemSchema).min(1, "Добавьте хотя бы одну позицию"),
  jointVentureItems: z.array(esfItemSchema),
  supplierAgent: agentSchema.nullable(),
  buyerAgent: agentSchema.nullable(),
  additionalInfo: z.string(),
  issuedByFullName: z.string(),
  totalSum: z.number(),
  totalExcise: z.number(),
  totalVat: z.number(),
  totalSumWithTax: z.number(),
});
