import { describe, expect, it } from "vitest";
import { calculateSimplifiedTax } from "../simplified";
import { TAX_2026 } from "../tax-config-2026";

describe("calculateSimplifiedTax — базовый расчёт", () => {
  it("налог = ставка × доход за полугодие без работников", () => {
    const r = calculateSimplifiedTax({ halfYearIncome: 10_000_000, regionId: "default" });
    expect(r.rate).toBe(0.04);
    expect(r.taxBeforeDiscount).toBe(400_000);
    expect(r.tax).toBe(400_000);
    expect(r.discountAmount).toBe(0);
  });

  it("пониженная региональная ставка применяется корректно", () => {
    const r = calculateSimplifiedTax({ halfYearIncome: 10_000_000, regionId: "turkistan" });
    expect(r.rate).toBe(0.02);
    expect(r.taxBeforeDiscount).toBe(200_000);
  });
});

describe("calculateSimplifiedTax — льгота за работников", () => {
  it("льгота 1,5% за каждого работника применяется при средней ЗП ≥ 25 МРП/мес", () => {
    const r = calculateSimplifiedTax({
      halfYearIncome: 10_000_000,
      regionId: "default",
      employeeCount: 3,
      employeesHalfYearPayroll: 3 * 200_000 * 6, // средняя ЗП 200 000 ₸/мес на человека
    });
    expect(r.isEmployeeDiscountEligible).toBe(true);
    expect(r.qualifyingEmployees).toBe(3);
    expect(r.discountRate).toBeCloseTo(0.045, 5);
    // 4,5% от дохода (450 000) больше налога (400 000) — налог не может стать отрицательным
    expect(r.discountAmount).toBe(400_000);
    expect(r.tax).toBe(0);
  });

  it("льгота не применяется, если средняя ЗП работника ниже 25 МРП/мес", () => {
    const lowSalary = 10 * TAX_2026.MRP; // намного ниже порога 25 МРП
    const r = calculateSimplifiedTax({
      halfYearIncome: 10_000_000,
      regionId: "default",
      employeeCount: 2,
      employeesHalfYearPayroll: 2 * lowSalary * 6,
    });
    expect(r.isEmployeeDiscountEligible).toBe(false);
    expect(r.discountAmount).toBe(0);
    expect(r.tax).toBe(r.taxBeforeDiscount);
  });

  it("один работник с достаточной ЗП уменьшает налог на 1,5% от дохода", () => {
    const r = calculateSimplifiedTax({
      halfYearIncome: 10_000_000,
      regionId: "default",
      employeeCount: 1,
      employeesHalfYearPayroll: 30 * TAX_2026.MRP * 6,
    });
    expect(r.discountAmount).toBeCloseTo(0.015 * 10_000_000, 5);
    expect(r.tax).toBeCloseTo(400_000 - 0.015 * 10_000_000, 5);
  });
});

describe("calculateSimplifiedTax — проверка лимита дохода 600 000 МРП/год", () => {
  it("при доходе далеко от лимита usageRatio мал", () => {
    const r = calculateSimplifiedTax({ halfYearIncome: 10_000_000, regionId: "default" });
    expect(r.limitUsageRatio).toBeLessThan(0.1);
  });

  it("при приближении годового дохода к лимиту usageRatio близок к 1", () => {
    const annualLimit = TAX_2026.SIMPLIFIED_INCOME_LIMIT_MRP * TAX_2026.MRP;
    const r = calculateSimplifiedTax({ halfYearIncome: annualLimit / 2, regionId: "default" });
    expect(r.limitUsageRatio).toBeCloseTo(1, 5);
  });

  it("при превышении лимита usageRatio больше 1", () => {
    const annualLimit = TAX_2026.SIMPLIFIED_INCOME_LIMIT_MRP * TAX_2026.MRP;
    const r = calculateSimplifiedTax({ halfYearIncome: annualLimit, regionId: "default" });
    expect(r.limitUsageRatio).toBeGreaterThan(1);
  });
});
