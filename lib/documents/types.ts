export type DocumentType = "avr" | "poa" | "payroll" | "waybill";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  avr: "АВР (Р-1)",
  poa: "Доверенность (Д-1)",
  payroll: "Расчётная ведомость (Т-1)",
  waybill: "Накладная (З-2)",
};

export interface CompanyRequisites {
  companyName: string;
  binIin: string;
  isIndividualEntrepreneur: boolean;
  directorName: string;
  accountantName: string;
  address: string;
  bankName: string;
  iik: string;
  bik: string;
  /** Путь в бакете Storage company-files, не публичный URL */
  signaturePath: string | null;
  stampPath: string | null;
}

export const EMPTY_REQUISITES: CompanyRequisites = {
  companyName: "",
  binIin: "",
  isIndividualEntrepreneur: false,
  directorName: "",
  accountantName: "",
  address: "",
  bankName: "",
  iik: "",
  bik: "",
  signaturePath: null,
  stampPath: null,
};

// ---------- Форма Р-1: Акт выполненных работ (АВР) ----------

export interface AvrItem {
  name: string;
  reportInfo: string;
  unit: string;
  quantity: number;
  price: number;
}

export interface AvrData {
  documentNumber: string;
  documentDate: string;
  periodFrom: string;
  periodTo: string;
  customerName: string;
  customerBinIin: string;
  executorName: string;
  contractNumber: string;
  contractDate: string;
  reservesInfo: string;
  attachmentPages: string;
  items: AvrItem[];
}

// ---------- Форма Д-1: Доверенность ----------

export interface PoaAssetItem {
  name: string;
  unit: string;
  quantityInWords: string;
}

export interface PoaData {
  poaNumber: string;
  issueDate: string;
  validUntilRecipient: string;
  validUntilPayer: string;
  bankAccount: string;
  bankName: string;
  issuedToPosition: string;
  issuedToName: string;
  idDocumentSeries: string;
  idDocumentNumber: string;
  idDocumentDate: string;
  idDocumentIssuedBy: string;
  supplierName: string;
  documentBasis: string;
  items: PoaAssetItem[];
}

// ---------- Форма З-2: Накладная на отпуск запасов на сторону ----------

export interface WaybillItem {
  name: string;
  nomenclatureNumber: string;
  unit: string;
  quantityToRelease: number;
  quantityReleased: number;
  price: number;
  sumWithVat: number;
  vatSum: number;
}

export interface WaybillData {
  documentNumber: string;
  documentDate: string;
  senderName: string;
  recipientName: string;
  responsiblePerson: string;
  transportOrganization: string;
  transportDocument: string;
  items: WaybillItem[];
  poaNumber: string;
  poaDate: string;
  poaIssuedTo: string;
}

// ---------- Форма Т-1: Расчётная ведомость ----------

export interface PayrollSheetEmployee {
  fullName: string;
  personnelNumber: string;
  category: string;
  position: string;
  workConditions: string;
  tariffRate: number;
  hourlyRate: number;
  daysWorked: number;
  hoursWorked: number;
  bonus: number;
  sickLeave: number;
  advance: number;
  birthDate: string;
  familyStatus: string;
  note: string;
}

export interface PayrollSheetData {
  period: string;
  department: string;
  employees: PayrollSheetEmployee[];
}
