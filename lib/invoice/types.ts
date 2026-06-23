export interface InvoiceParty {
  binIin: string; // БИН/ИИН
  name: string; // наименование
  address?: string;
}

export interface InvoiceItem {
  code: string; // код товара
  name: string; // наименование
  qty: number; // кол-во
  unit: string; // ед. изм. (шт, м, кг...)
  price: number; // цена за единицу
}

export interface InvoiceBeneficiary {
  name: string;
  iin: string;
  iik: string;
  kbe: string;
  bankName: string;
  bik: string;
  knp: string;
}

export interface InvoiceData {
  number: string; // № счёта
  date: string; // дата (ISO), форматируется как «22 июня 2026 г.»
  beneficiary: InvoiceBeneficiary; // платёжное поручение
  supplier: InvoiceParty;
  buyer: InvoiceParty;
  contract: string; // напр. «Без договора»
  items: InvoiceItem[];
  isVatPayer: boolean; // плательщик НДС? влияет на строку «В том числе НДС»
  showTaxBlock: boolean; // показывать ли налоговый блок
  /** Налогооблагаемый доход (сумма без НДС − расходы) для налогового блока, тенге */
  taxableIncome?: number;
}
