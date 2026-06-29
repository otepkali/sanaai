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
  /** Режим налогообложения, например "Розничный налог" */
  regime: string;
  /** Код бенефициара (КБе) */
  kbe: string;
  isVatPayer: boolean;
  /** Статус по единому платежу, например "Неплательщик ЕП" */
  singlePaymentStatus: string;
  logoPath: string | null;
  ownerFullName: string;
  residencyCountry: string;
  ownerMonthlyIncome: number | null;
  ownerStatuses: string;
  taxAuthorityRegistration: string;
  taxAuthorityResidence: string;
  akimatBin: string;
  registrationCertificateNumber: string;
  registrationCertificateDate: string | null;
  currency: string;
  stockControlEnabled: boolean;
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
  regime: "",
  kbe: "",
  isVatPayer: false,
  singlePaymentStatus: "Неплательщик ЕП",
  logoPath: null,
  ownerFullName: "",
  residencyCountry: "Казахстан",
  ownerMonthlyIncome: null,
  ownerStatuses: "",
  taxAuthorityRegistration: "",
  taxAuthorityResidence: "",
  akimatBin: "",
  registrationCertificateNumber: "",
  registrationCertificateDate: null,
  currency: "KZT",
  stockControlEnabled: false,
};

// ---------- Дополнительные адреса, счета, склады, кассы, подписанты ----------

export type CompanyAddressType = "legal" | "actual" | "other";

export interface CompanyAddress {
  id: string;
  type: CompanyAddressType;
  address: string;
  sortOrder: number;
}

export interface CompanyBankAccount {
  id: string;
  label: string;
  accountNumber: string;
  currency: string;
  bik: string;
  bankName: string;
  sortOrder: number;
}

export interface CompanyWarehouse {
  id: string;
  name: string;
  address: string;
  sortOrder: number;
}

export interface CompanyCashRegister {
  id: string;
  name: string;
  cashierName: string;
  address: string;
  sortOrder: number;
}

export type CompanySignerRole =
  | "individual_entrepreneur"
  | "chief_accountant"
  | "goods_release"
  | "invoice_for_director"
  | "invoice_for_accountant";

export const SIGNER_ROLE_LABELS: Record<CompanySignerRole, string> = {
  individual_entrepreneur: "Индивидуальный предприниматель",
  chief_accountant: "Главный бухгалтер",
  goods_release: "Отпуск товаров",
  invoice_for_director: "Подписывающие С/Ф за руководителя",
  invoice_for_accountant: "Подписывающие С/Ф за главного бухгалтера",
};

export interface CompanySigner {
  id: string;
  role: CompanySignerRole;
  fullName: string;
  signaturePath: string | null;
  sortOrder: number;
}

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
