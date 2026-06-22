import { describe, expect, it } from "vitest";
import { formatDateLong, formatDecimal } from "../format";

describe("formatDecimal", () => {
  it("форматирует с двумя знаками по умолчанию, запятая как разделитель", () => {
    expect(formatDecimal(626.06)).toBe("626,06");
    expect(formatDecimal(11.7)).toBe("11,70");
  });

  it("группирует тысячи неразрывным пробелом", () => {
    expect(formatDecimal(96_840)).toBe("96 840,00");
    expect(formatDecimal(333_920)).toBe("333 920,00");
  });

  it("поддерживает произвольную точность, например 3 знака для количества", () => {
    expect(formatDecimal(200, 3)).toBe("200,000");
    expect(formatDecimal(1000, 3)).toBe("1 000,000");
  });
});

describe("formatDateLong", () => {
  it("форматирует ISO-дату в виде «22 июня 2026 г.»", () => {
    expect(formatDateLong("2026-06-22")).toBe("22 июня 2026 г.");
  });

  it("возвращает прочерк для пустой строки", () => {
    expect(formatDateLong("")).toBe("—");
  });
});
