import { describe, expect, it } from "vitest";
import { compareTaxRegimes } from "../compare";
import { TAX_2026 } from "../tax-config-2026";

describe("compareTaxRegimes — высокая маржа, низкие расходы", () => {
  it("упрощёнка выгоднее, когда расходы и ФОТ малы относительно оборота", () => {
    const r = compareTaxRegimes({
      annualRevenue: 20_000_000,
      annualExpenses: 2_000_000,
      annualPayroll: 0,
    });
    expect(r.simplifiedTax).toBe(800_000); // 4% × 20 000 000
    expect(r.generalProfit).toBe(18_000_000);
    expect(r.generalIpn).toBe(1_800_000); // 10% × 18 000 000
    expect(r.generalSocialTax).toBe(0);
    expect(r.generalTax).toBe(1_800_000);
    expect(r.cheaperRegime).toBe("simplified");
    expect(r.savingsAmount).toBe(1_000_000);
  });
});

describe("compareTaxRegimes — высокие расходы и ФОТ", () => {
  it("ОУР выгоднее, когда расходы и ФОТ существенно снижают прибыль", () => {
    const r = compareTaxRegimes({
      annualRevenue: 20_000_000,
      annualExpenses: 15_000_000,
      annualPayroll: 3_000_000,
    });
    expect(r.simplifiedTax).toBe(800_000);
    expect(r.generalProfit).toBe(2_000_000);
    expect(r.generalIpn).toBe(200_000);
    expect(r.generalSocialTax).toBe(180_000); // 6% × 3 000 000
    expect(r.generalTax).toBe(380_000);
    expect(r.cheaperRegime).toBe("general");
    expect(r.savingsAmount).toBe(420_000);
  });
});

describe("compareTaxRegimes — прибыль не уходит в минус", () => {
  it("прибыль ограничена нулём, если расходы и ФОТ превышают оборот", () => {
    const r = compareTaxRegimes({
      annualRevenue: 5_000_000,
      annualExpenses: 4_000_000,
      annualPayroll: 3_000_000,
    });
    expect(r.generalProfit).toBe(0);
    expect(r.generalIpn).toBe(0);
    expect(r.generalSocialTax).toBe(180_000); // соцналог на ФОТ платится независимо от прибыли
  });
});

describe("compareTaxRegimes — лимит упрощёнки 600 000 МРП/год", () => {
  it("отмечает превышение годового лимита дохода", () => {
    const limit = TAX_2026.SIMPLIFIED_INCOME_LIMIT_MRP * TAX_2026.MRP;
    const r = compareTaxRegimes({
      annualRevenue: limit + 1,
      annualExpenses: 0,
      annualPayroll: 0,
    });
    expect(r.isOverSimplifiedLimit).toBe(true);
  });

  it("не отмечает превышение, если доход в пределах лимита", () => {
    const limit = TAX_2026.SIMPLIFIED_INCOME_LIMIT_MRP * TAX_2026.MRP;
    const r = compareTaxRegimes({
      annualRevenue: limit,
      annualExpenses: 0,
      annualPayroll: 0,
    });
    expect(r.isOverSimplifiedLimit).toBe(false);
  });

  it("при превышении лимита упрощёнка не может быть «выгоднее», даже если формально дешевле", () => {
    const limit = TAX_2026.SIMPLIFIED_INCOME_LIMIT_MRP * TAX_2026.MRP;
    const r = compareTaxRegimes({
      annualRevenue: limit * 1.5,
      annualExpenses: 0,
      annualPayroll: 0,
    });
    expect(r.isOverSimplifiedLimit).toBe(true);
    expect(r.simplifiedTax).toBeLessThan(r.generalTax);
    expect(r.cheaperRegime).toBe("general");
  });
});
