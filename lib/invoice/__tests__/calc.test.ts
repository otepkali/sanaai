import { describe, expect, it } from "vitest";
import { calculateInvoiceTotals, formatMoney, numberToWordsKZT } from "../calc";
import type { InvoiceData } from "../types";

function buildInvoice(overrides: Partial<InvoiceData> = {}): InvoiceData {
  return {
    number: "133",
    date: "2026-06-22",
    beneficiary: {
      name: 'Индивидуальный предприниматель "Gold интерьер"',
      iin: "810624301456",
      iik: "KZ26998STB0000933797",
      kbe: "19",
      bankName: 'АО "Alatau City Bank" г. Шымкент',
      bik: "TSESKZKA",
      knp: "710",
    },
    supplier: { binIin: "810624301456", name: 'ИП "Gold интерьер"' },
    buyer: { binIin: "750101407098", name: "ИП Асыл-Олжа" },
    contract: "Без договора",
    items: [],
    isVatPayer: true,
    showTaxBlock: false,
    ...overrides,
  };
}

describe("formatMoney", () => {
  it("форматирует сумму как в 1С — неразрывный пробел в тысячах, запятая для копеек", () => {
    expect(formatMoney(333_920)).toBe("333 920,00");
  });
});

describe("numberToWordsKZT", () => {
  it("переводит сумму в слова с неизменяемым «тиын» (без склонения)", () => {
    expect(numberToWordsKZT(333_920)).toBe(
      "Триста тридцать три тысячи девятьсот двадцать тенге 00 тиын"
    );
  });

  it("корректно обрабатывает тиыны больше нуля", () => {
    expect(numberToWordsKZT(100.5)).toBe("Сто тенге 50 тиын");
  });
});

describe("calculateInvoiceTotals — Итого по образцу", () => {
  it("суммирует строки 96 840 + 225 380 + 11 700 = 333 920,00", () => {
    const data = buildInvoice({
      items: [
        { code: "1", name: "Позиция 1", qty: 1, unit: "шт", price: 96_840 },
        { code: "2", name: "Позиция 2", qty: 1, unit: "шт", price: 225_380 },
        { code: "3", name: "Позиция 3", qty: 1, unit: "шт", price: 11_700 },
      ],
    });
    const result = calculateInvoiceTotals(data);
    expect(result.total).toBe(333_920);
    expect(formatMoney(result.total)).toBe("333 920,00");
    expect(result.itemsCount).toBe(3);
  });

  it("сумма строки = qty × price", () => {
    const data = buildInvoice({
      items: [{ code: "1", name: "Товар", qty: 200, unit: "шт", price: 484.2 }],
    });
    const result = calculateInvoiceTotals(data);
    expect(result.lines[0].lineTotal).toBeCloseTo(96_840, 5);
  });
});

describe("calculateInvoiceTotals — НДС «в том числе» 16/116", () => {
  it("НДС от 333 920,00 при isVatPayer=true → 46 057,93", () => {
    const data = buildInvoice({
      items: [{ code: "1", name: "Товар", qty: 1, unit: "шт", price: 333_920 }],
      isVatPayer: true,
    });
    const result = calculateInvoiceTotals(data);
    expect(result.vatAmount).not.toBeNull();
    expect(formatMoney(result.vatAmount as number)).toBe("46 057,93");
  });

  it("строка НДС не показывается, если isVatPayer=false", () => {
    const data = buildInvoice({
      items: [{ code: "1", name: "Товар", qty: 1, unit: "шт", price: 333_920 }],
      isVatPayer: false,
    });
    const result = calculateInvoiceTotals(data);
    expect(result.vatAmount).toBeNull();
  });
});

describe("calculateInvoiceTotals — налоговый блок", () => {
  it("ИПН не считается, если showTaxBlock=false", () => {
    const data = buildInvoice({ showTaxBlock: false, taxableIncome: 1_000_000 });
    expect(calculateInvoiceTotals(data).ipnAmount).toBeNull();
  });

  it("ИПН = 10% от налогооблагаемого дохода, если showTaxBlock=true", () => {
    const data = buildInvoice({ showTaxBlock: true, taxableIncome: 1_000_000 });
    expect(calculateInvoiceTotals(data).ipnAmount).toBe(100_000);
  });
});
