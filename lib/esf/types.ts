// Структура данных ЭСФ по официальной форме (Приложение 2 к Правилам документооборота
// счетов-фактур, выписываемых в электронном виде, ИС ЭСФ КГД РК).
// Названия XML-тегов в generate-xml.ts подобраны по смыслу поля — реальной XSD-схемы
// или примера "сырого" XML от ИС ЭСФ нам не предоставили, есть только печатная форма
// (PDF) с номерами полей. Номера полей указаны в комментариях для сверки с формой.

export const SUPPLIER_CATEGORIES = [
  { value: "A", label: "A — Коммитент" },
  { value: "B", label: "B — Комиссионер" },
  { value: "C", label: "C — Экспедитор" },
  { value: "D", label: "D — Лизингодатель" },
  { value: "E", label: "E — Участник СРП или сделки, заключённой в рамках СРП" },
  { value: "F", label: "F — Участник договора о совместной деятельности" },
  { value: "G", label: "G — Экспортёр" },
  { value: "H", label: "H — Международный перевозчик" },
  { value: "I", label: "I — Доверитель" },
  { value: "J", label: "J — Адвокат / Поверенный" },
] as const;

export const BUYER_CATEGORIES = [
  { value: "A", label: "A — Комитент" },
  { value: "B", label: "B — Комиссионер" },
  { value: "C", label: "C — Лизингополучатель" },
  { value: "D", label: "D — Участник договора о совместной деятельности" },
  { value: "E", label: "E — Государственное учреждение" },
  { value: "F", label: "F — Нерезидент" },
  { value: "G", label: "G — Участник СРП или сделки, заключённой в рамках СРП" },
  { value: "H", label: "H — Доверитель" },
  { value: "I", label: "I — Розничная реализация" },
  { value: "J", label: "J — Физическое лицо" },
] as const;

export interface EsfSectionA {
  registrationNumber: string; // 1 — присваивается ИС ЭСФ при регистрации, для черновика пусто
  accountingSystemNumber: string; // 1.1 Номер учётной системы
  issueDate: string; // 2 Дата выписки
  paperIssueDate: string; // 2.1 Дата выписки на бумажном носителе
  turnoverDate: string; // 3 Дата совершения оборота
  isCorrected: boolean; // 4 Исправленный
  correctedDate: string; // 4.1
  correctedSystemNumber: string; // 4.2 Номер учётной системы
  correctedRegistrationNumber: string; // 4.3 Регистрационный номер
  isAdditional: boolean; // 5 Дополнительный
  additionalDate: string; // 5.1
  additionalSystemNumber: string; // 5.2 Номер учётной системы
  additionalRegistrationNumber: string; // 5.3 Регистрационный номер
}

export interface EsfSectionB {
  binIin: string; // 6 ИИН/БИН поставщика
  structuralUnitBin: string; // 6.0 БИН структурного подразделения юр. лица
  reorganizedBin: string; // 6.1 БИН реорганизованного лица
  name: string; // 7 Поставщик
  participationShare: string; // 7.1 Доля участия
  address: string; // 8 Адрес места нахождения
  vatCertificateSeries: string; // 9.1 Серия
  vatCertificateNumber: string; // 9.2 Номер
  isNonResidentStructuralUnit: boolean; // 9.3 Структурное подразделение юр. лица-нерезидента
  category: string; // 10 Категория поставщика (см. SUPPLIER_CATEGORIES)
  participantsCount: string; // 10.1 Количество (для E/F)
  additionalInfo: string; // 11 Дополнительные сведения
}

export interface EsfSectionB1 {
  kbe: string; // 12 КБе
  iik: string; // 13 ИИК
  bik: string; // 14 БИК
  bankName: string; // 15 Наименование банка
}

export interface EsfSectionC {
  binIin: string; // 16 ИИН/БИН покупателя
  structuralUnitBin: string; // 16.0
  reorganizedBin: string; // 16.1
  name: string; // 17 Получатель
  participationShare: string; // 17.1 Доля участия
  address: string; // 18 Адрес места нахождения
  countryCode: string; // 18.1 Код страны
  additionalInfo: string; // 19 Дополнительные сведения
  category: string; // 20 Категория получателя (см. BUYER_CATEGORIES)
  participantsCount: string; // 20.1 Количество
}

/** Раздел C1 — только если получатель категории E (государственное учреждение) */
export interface EsfSectionC1 {
  iik: string; // 21 ИИК
  productCode: string; // 22 Код товара, работ, услуг
  paymentPurpose: string; // 23 Назначение платежа
  bik: string; // 24 БИК (обычно казначейство, напр. KKMFKZ2A)
}

export interface EsfSectionD {
  shipperBinIin: string; // 25.1
  shipperName: string; // 25.2
  shipperAddress: string; // 25.3
  consigneeBinIin: string; // 26.1
  consigneeName: string; // 26.2
  consigneeAddress: string; // 26.3
  consigneeCountryCode: string; // 26.4
}

export interface EsfSectionE {
  hasContract: boolean; // 27.1 Договор (контракт) на поставку
  noContract: boolean; // 27.2 Без договора (контракта) на поставку
  contractNumber: string; // 27.3
  contractDate: string; // 27.4
  contractAccountingNumber: string; // 27.5 Учётный номер
  paymentTerms: string; // 28 Условия оплаты по договору
  dispatchMethod: string; // 29 Способ отправления (код)
  poaNumber: string; // 30.1 Номер доверенности
  poaDate: string; // 30.2 Дата доверенности
  destination: string; // 31 Пункт назначения
  deliveryTerms: string; // 31.1 Условия поставки
}

export interface EsfSectionF {
  documentNumber: string; // 32.1 Номер документа, подтверждающего поставку
  documentDate: string; // 32.2 Дата
  currencyCode: string; // 33.1 Код валюты
  currencyRate: string; // 33.2 Курс валюты (если не KZT)
}

export interface EsfItem {
  originFlag: string; // 2 Признак происхождения товара/работ/услуг
  name: string; // 3 Наименование товаров, работ, услуг
  tnvedName: string; // 3/1 Наименование по Декларации на товары / заявлению о ввозе
  tnvedCode: string; // 4 Код товара (ТН ВЭД ЕАЭС)
  unit: string; // 5 Ед. изм.
  quantity: number; // 6 Кол-во (объём)
  price: number; // 7 Цена (тариф) за единицу без косвенных налогов
  sum: number; // 8 Стоимость без косвенных налогов
  exciseRate: string; // 9 Акциз — ставка
  exciseSum: number; // 10 Акциз — сумма
  turnoverInfo: string; // 11 Размер оборота по реализации (облагаемый/необлагаемый)
  vatRate: string; // 12 НДС — ставка
  vatSum: number; // 13 НДС — сумма
  sumWithTax: number; // 14 Стоимость с учётом косвенных налогов
  declarationNumber: string; // 15 № Декларации на товары / заявления в рамках ТС / СТ-1 / СТ-KZ
  tradePositionNumber: string; // 16 Номер товарной позиции
  supplierEsfRegistrationNumber: string; // 17 Рег. номер ЭСФ поставщика товара, включённого в Перечень
  additionalData: string; // 18 Дополнительные данные
}

/** Раздел I/J — поверенный (оператор) поставщика или покупателя, заполняется редко */
export interface EsfAgent {
  bin: string;
  name: string; // Поверенный
  address: string;
  documentNumber: string;
  documentDate: string;
}

export interface EsfData {
  sectionA: EsfSectionA;
  sectionB: EsfSectionB;
  sectionB1: EsfSectionB1;
  sectionC: EsfSectionC;
  sectionC1: EsfSectionC1 | null;
  sectionD: EsfSectionD;
  sectionE: EsfSectionE;
  sectionF: EsfSectionF;
  items: EsfItem[];
  jointVentureItems: EsfItem[]; // Раздел H — для участников совместной деятельности
  supplierAgent: EsfAgent | null; // Раздел I
  buyerAgent: EsfAgent | null; // Раздел J
  additionalInfo: string; // 43 Раздел K. Дополнительные сведения
  issuedByFullName: string; // 46 Ф.И.О. лица, выписывающего ЭСФ
  totalSum: number;
  totalExcise: number;
  totalVat: number;
  totalSumWithTax: number;
}

export function createEmptyItem(): EsfItem {
  return {
    originFlag: "",
    name: "",
    tnvedName: "",
    tnvedCode: "",
    unit: "",
    quantity: 0,
    price: 0,
    sum: 0,
    exciseRate: "",
    exciseSum: 0,
    turnoverInfo: "",
    vatRate: "",
    vatSum: 0,
    sumWithTax: 0,
    declarationNumber: "",
    tradePositionNumber: "",
    supplierEsfRegistrationNumber: "",
    additionalData: "",
  };
}

export function createEmptyEsfData(): EsfData {
  const today = new Date().toISOString().slice(0, 10);
  return {
    sectionA: {
      registrationNumber: "",
      accountingSystemNumber: "",
      issueDate: today,
      paperIssueDate: "",
      turnoverDate: today,
      isCorrected: false,
      correctedDate: "",
      correctedSystemNumber: "",
      correctedRegistrationNumber: "",
      isAdditional: false,
      additionalDate: "",
      additionalSystemNumber: "",
      additionalRegistrationNumber: "",
    },
    sectionB: {
      binIin: "",
      structuralUnitBin: "",
      reorganizedBin: "",
      name: "",
      participationShare: "",
      address: "",
      vatCertificateSeries: "",
      vatCertificateNumber: "",
      isNonResidentStructuralUnit: false,
      category: "",
      participantsCount: "",
      additionalInfo: "",
    },
    sectionB1: { kbe: "", iik: "", bik: "", bankName: "" },
    sectionC: {
      binIin: "",
      structuralUnitBin: "",
      reorganizedBin: "",
      name: "",
      participationShare: "",
      address: "",
      countryCode: "KZ",
      additionalInfo: "",
      category: "",
      participantsCount: "",
    },
    sectionC1: null,
    sectionD: {
      shipperBinIin: "",
      shipperName: "",
      shipperAddress: "",
      consigneeBinIin: "",
      consigneeName: "",
      consigneeAddress: "",
      consigneeCountryCode: "KZ",
    },
    sectionE: {
      hasContract: false,
      noContract: true,
      contractNumber: "",
      contractDate: "",
      contractAccountingNumber: "",
      paymentTerms: "безналичный расчет",
      dispatchMethod: "",
      poaNumber: "",
      poaDate: "",
      destination: "",
      deliveryTerms: "",
    },
    sectionF: { documentNumber: "", documentDate: "", currencyCode: "KZT", currencyRate: "" },
    items: [createEmptyItem()],
    jointVentureItems: [],
    supplierAgent: null,
    buyerAgent: null,
    additionalInfo: "",
    issuedByFullName: "",
    totalSum: 0,
    totalExcise: 0,
    totalVat: 0,
    totalSumWithTax: 0,
  };
}
