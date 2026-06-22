import { describe, expect, it } from "vitest";
import { calculateInvoice } from "../invoice";

const oneItem = (unitPrice: number, quantity = 1) => [
  { name: "Поставка оборудования", unit: "шт.", quantity, unitPrice },
];

describe("calculateInvoice — без НДС", () => {
  it("сумма к оплате равна сумме строк, налог не выделяется", () => {
    const r = calculateInvoice({
      items: oneItem(1_000_000),
      isVatPayer: false,
      vatMode: "exclusive",
      entityType: "ip",
      expenseSharePercent: 0,
    });
    expect(r.subtotal).toBe(1_000_000);
    expect(r.vatAmount).toBe(0);
    expect(r.netAmount).toBe(1_000_000);
    expect(r.grossAmount).toBe(1_000_000);
  });
});

describe("calculateInvoice — НДС начисляется сверху", () => {
  it("16% начисляется на сумму строк", () => {
    const r = calculateInvoice({
      items: oneItem(1_000_000),
      isVatPayer: true,
      vatMode: "exclusive",
      entityType: "ip",
      expenseSharePercent: 0,
    });
    expect(r.netAmount).toBe(1_000_000);
    expect(r.vatAmount).toBeCloseTo(160_000, 5);
    expect(r.grossAmount).toBeCloseTo(1_160_000, 5);
  });
});

describe("calculateInvoice — НДС выделяется «в том числе»", () => {
  it("сумма строк уже включает налог", () => {
    const r = calculateInvoice({
      items: oneItem(1_160_000),
      isVatPayer: true,
      vatMode: "inclusive",
      entityType: "ip",
      expenseSharePercent: 0,
    });
    expect(r.netAmount).toBeCloseTo(1_000_000, 5);
    expect(r.vatAmount).toBeCloseTo(160_000, 5);
    expect(r.grossAmount).toBe(1_160_000);
  });
});

describe("calculateInvoice — КПН 20% для ТОО считается от прибыли, а не от оборота", () => {
  it("без расходов налог берётся от всей суммы без НДС", () => {
    const r = calculateInvoice({
      items: oneItem(1_000_000),
      isVatPayer: true,
      vatMode: "exclusive",
      entityType: "too",
      expenseSharePercent: 0,
    });
    expect(r.taxableProfit).toBe(1_000_000);
    expect(r.profitTaxRate).toBe(0.2);
    expect(r.profitTax).toBe(200_000);
  });

  it("расходы 60% уменьшают налогооблагаемую базу", () => {
    const r = calculateInvoice({
      items: oneItem(1_000_000),
      isVatPayer: true,
      vatMode: "exclusive",
      entityType: "too",
      expenseSharePercent: 60,
    });
    expect(r.taxableProfit).toBe(400_000); // 1 000 000 × (1 − 0,6)
    expect(r.profitTax).toBe(80_000); // 20% × 400 000
  });
});

describe("calculateInvoice — ИПН 10% для ИП считается от прибыли", () => {
  it("ставка ИПН отличается от КПН при той же сделке", () => {
    const r = calculateInvoice({
      items: oneItem(1_000_000),
      isVatPayer: true,
      vatMode: "exclusive",
      entityType: "ip",
      expenseSharePercent: 60,
    });
    expect(r.taxableProfit).toBe(400_000);
    expect(r.profitTaxRate).toBe(0.1);
    expect(r.profitTax).toBe(40_000);
  });
});

describe("calculateInvoice — несколько позиций", () => {
  it("суммирует строки с разным количеством и ценой", () => {
    const r = calculateInvoice({
      items: [
        { name: "Товар А", unit: "шт.", quantity: 2, unitPrice: 100_000 },
        { name: "Услуга Б", unit: "услуга", quantity: 1, unitPrice: 50_000 },
      ],
      isVatPayer: false,
      vatMode: "exclusive",
      entityType: "ip",
      expenseSharePercent: 0,
    });
    expect(r.lines[0].lineTotal).toBe(200_000);
    expect(r.lines[1].lineTotal).toBe(50_000);
    expect(r.subtotal).toBe(250_000);
  });
});
