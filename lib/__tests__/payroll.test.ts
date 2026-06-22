import { describe, expect, it } from "vitest";
import { calculatePayroll } from "../payroll";
import { TAX_2026 } from "../tax-config-2026";

describe("calculatePayroll — эталонные примеры (ТОО на ОУР, вычет 30 МРП применён)", () => {
  it("оклад 85 000 ₸ — база ИПН отрицательная, ИПН = 0", () => {
    const r = calculatePayroll({ grossSalary: 85000 });
    expect(r.opv).toBe(8500);
    expect(r.vosms).toBe(1700);
    expect(r.ipn).toBe(0);
    expect(r.netIncome).toBe(74800);
  });

  it("оклад 200 000 ₸", () => {
    const r = calculatePayroll({ grossSalary: 200000 });
    expect(r.opv).toBe(20000);
    expect(r.vosms).toBe(4000);
    expect(r.ipn).toBe(4625);
    expect(r.netIncome).toBe(171375);
  });

  it("оклад 300 000 ₸", () => {
    const r = calculatePayroll({ grossSalary: 300000 });
    expect(r.opv).toBe(30000);
    expect(r.vosms).toBe(6000);
    expect(r.ipn).toBe(13425);
    expect(r.netIncome).toBe(250575);
  });
});

describe("calculatePayroll — пределы баз начисления", () => {
  it("ОПВ ограничен потолком 50 × МЗП", () => {
    const ceiling = 50 * TAX_2026.MZP; // 4 250 000
    const r = calculatePayroll({ grossSalary: ceiling * 2 });
    expect(r.opv).toBe(TAX_2026.OPV * ceiling);
  });

  it("ВОСМС ограничен потолком 20 × МЗП", () => {
    const ceiling = 20 * TAX_2026.MZP; // 1 700 000
    const r = calculatePayroll({ grossSalary: ceiling * 2 });
    expect(r.vosms).toBe(TAX_2026.VOSMS * ceiling);
  });

  it("ООСМС ограничен потолком 40 × МЗП", () => {
    const ceiling = 40 * TAX_2026.MZP; // 3 400 000
    const r = calculatePayroll({ grossSalary: ceiling * 2 });
    expect(r.oosms).toBe(TAX_2026.OOSMS * ceiling);
  });

  it("СО не опускается ниже пола 1 × МЗП при низком окладе", () => {
    const r = calculatePayroll({ grossSalary: TAX_2026.MZP });
    const floor = 1 * TAX_2026.MZP;
    expect(r.so).toBe(TAX_2026.SO * floor);
  });

  it("СО не превышает потолок 7 × МЗП при высоком окладе", () => {
    const r = calculatePayroll({ grossSalary: 100 * TAX_2026.MZP });
    const ceiling = 7 * TAX_2026.MZP;
    expect(r.so).toBe(TAX_2026.SO * ceiling);
  });
});

describe("calculatePayroll — льготные категории", () => {
  it("пенсионер: ОПВ, ВОСМС и СО не начисляются", () => {
    const r = calculatePayroll({ grossSalary: 300000, benefitCategory: "pensioner" });
    expect(r.opv).toBe(0);
    expect(r.vosms).toBe(0);
    expect(r.so).toBe(0);
    expect(r.netIncome).toBeGreaterThan(0);
  });

  it("инвалид I-III группы: доп. вычет может обнулить базу ИПН", () => {
    const r = calculatePayroll({ grossSalary: 300000, benefitCategory: "disabled" });
    expect(r.disabilityDeductionMonthly).toBeCloseTo(
      (TAX_2026.DISABILITY_DEDUCTION_MRP * TAX_2026.MRP) / 12,
      5
    );
    expect(r.ipnBase).toBe(0);
    expect(r.ipn).toBe(0);
  });

  it("студент очной формы: освобождён от ВОСМС и ООСМС, но не от ОПВ", () => {
    const r = calculatePayroll({ grossSalary: 300000, benefitCategory: "student" });
    expect(r.vosms).toBe(0);
    expect(r.oosms).toBe(0);
    expect(r.opv).toBeGreaterThan(0);
  });
});

describe("calculatePayroll — прочие флаги", () => {
  it("ОПВР не начисляется для рождённых до 01.01.1975", () => {
    const r = calculatePayroll({ grossSalary: 300000, bornBeforeJan1975: true });
    expect(r.opvr).toBe(0);
  });

  it("ОПВР = 3,5% × оклад по умолчанию", () => {
    const r = calculatePayroll({ grossSalary: 300000 });
    expect(r.opvr).toBeCloseTo(0.035 * 300000, 5);
  });

  it("прогрессивная ставка 15% применяется при годовом доходе свыше 8500 МРП", () => {
    const monthlyOverThreshold = (TAX_2026.IPN_PROGRESSIVE_THRESHOLD_MRP * TAX_2026.MRP) / 12 + 100000;
    const r = calculatePayroll({ grossSalary: monthlyOverThreshold });
    expect(r.isProgressiveIpn).toBe(true);
    expect(r.ipnRate).toBe(TAX_2026.IPN_PROGRESSIVE);
  });

  it("без применения вычета 30 МРП база ИПН выше", () => {
    const withDeduction = calculatePayroll({ grossSalary: 300000 });
    const withoutDeduction = calculatePayroll({
      grossSalary: 300000,
      applyStandardDeduction: false,
    });
    expect(withoutDeduction.ipnBase).toBeGreaterThan(withDeduction.ipnBase);
    expect(withoutDeduction.standardDeduction).toBe(0);
  });

  it("СН уменьшается на сумму СО и не опускается ниже нуля", () => {
    const r = calculatePayroll({ grossSalary: 300000 });
    const expectedSn = Math.max(0, TAX_2026.SN * (300000 - r.opv - r.vosms) - r.so);
    expect(r.sn).toBeCloseTo(expectedSn, 5);
  });

  it("полная стоимость для работодателя складывается из оклада и всех начислений", () => {
    const r = calculatePayroll({ grossSalary: 300000 });
    expect(r.employerCost).toBeCloseTo(
      r.grossSalary + r.so + r.oosms + r.opvr + r.sn,
      5
    );
  });
});
