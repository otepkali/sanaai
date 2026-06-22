import { describe, expect, it } from "vitest";
import { calculateVat, checkVatRegistrationThreshold } from "../vat";
import { TAX_2026 } from "../tax-config-2026";

describe("calculateVat — начисление сверху (exclusive)", () => {
  it("НДС = 16% × сумма без НДС", () => {
    const r = calculateVat({ amount: 100_000, mode: "exclusive" });
    expect(r.netAmount).toBe(100_000);
    expect(r.vatAmount).toBeCloseTo(16_000, 5);
    expect(r.grossAmount).toBeCloseTo(116_000, 5);
  });
});

describe("calculateVat — выделение «в том числе» (inclusive)", () => {
  it("корректно выделяет НДС из суммы, включающей налог", () => {
    const r = calculateVat({ amount: 116_000, mode: "inclusive" });
    expect(r.netAmount).toBeCloseTo(100_000, 5);
    expect(r.vatAmount).toBeCloseTo(16_000, 5);
    expect(r.grossAmount).toBe(116_000);
  });

  it("exclusive и inclusive — взаимно обратные операции", () => {
    const exclusive = calculateVat({ amount: 250_000, mode: "exclusive" });
    const inclusive = calculateVat({ amount: exclusive.grossAmount, mode: "inclusive" });
    expect(inclusive.netAmount).toBeCloseTo(250_000, 5);
    expect(inclusive.vatAmount).toBeCloseTo(exclusive.vatAmount, 5);
  });
});

describe("checkVatRegistrationThreshold — порог 10 000 МРП", () => {
  it("порог равен 43 250 000 ₸ при МРП 2026", () => {
    const r = checkVatRegistrationThreshold(0);
    expect(r.threshold).toBe(10_000 * TAX_2026.MRP);
    expect(r.threshold).toBe(43_250_000);
  });

  it("оборот ниже порога — постановка на учёт не требуется", () => {
    const r = checkVatRegistrationThreshold(40_000_000);
    expect(r.isRegistrationRequired).toBe(false);
    expect(r.usageRatio).toBeLessThan(1);
  });

  it("оборот на уровне порога — требуется постановка на учёт", () => {
    const r = checkVatRegistrationThreshold(43_250_000);
    expect(r.isRegistrationRequired).toBe(true);
    expect(r.usageRatio).toBeCloseTo(1, 5);
  });

  it("оборот выше порога — требуется постановка на учёт", () => {
    const r = checkVatRegistrationThreshold(60_000_000);
    expect(r.isRegistrationRequired).toBe(true);
    expect(r.usageRatio).toBeGreaterThan(1);
  });
});
