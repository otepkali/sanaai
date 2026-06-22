import { describe, expect, it } from "vitest";
import { numberToWordsRu, tengeAmountToWords } from "../number-to-words";

describe("numberToWordsRu", () => {
  it("ноль", () => {
    expect(numberToWordsRu(0)).toBe("ноль");
  });

  it("однозначные и двузначные числа", () => {
    expect(numberToWordsRu(1)).toBe("один");
    expect(numberToWordsRu(7)).toBe("семь");
    expect(numberToWordsRu(21)).toBe("двадцать один");
    expect(numberToWordsRu(15)).toBe("пятнадцать");
  });

  it("сотни", () => {
    expect(numberToWordsRu(100)).toBe("сто");
    expect(numberToWordsRu(567)).toBe("пятьсот шестьдесят семь");
  });

  it("тысячи — женский род и согласование с числительным", () => {
    expect(numberToWordsRu(1000)).toBe("одна тысяча");
    expect(numberToWordsRu(2000)).toBe("две тысячи");
    expect(numberToWordsRu(5000)).toBe("пять тысяч");
    expect(numberToWordsRu(11000)).toBe("одиннадцать тысяч");
    expect(numberToWordsRu(21000)).toBe("двадцать одна тысяча");
  });

  it("миллионы и миллиарды — мужской род", () => {
    expect(numberToWordsRu(1_000_000)).toBe("один миллион");
    expect(numberToWordsRu(2_000_000)).toBe("два миллиона");
    expect(numberToWordsRu(1_000_000_000)).toBe("один миллиард");
  });

  it("комбинированные разряды", () => {
    expect(numberToWordsRu(1_234_567)).toBe(
      "один миллион двести тридцать четыре тысячи пятьсот шестьдесят семь"
    );
  });
});

describe("tengeAmountToWords", () => {
  it("целая сумма без тиынов", () => {
    expect(tengeAmountToWords(1000)).toBe("Одна тысяча тенге 00 тиынов");
  });

  it("сумма с тиынами и правильным склонением", () => {
    expect(tengeAmountToWords(1234567.89)).toBe(
      "Один миллион двести тридцать четыре тысячи пятьсот шестьдесят семь тенге 89 тиынов"
    );
    expect(tengeAmountToWords(100.01)).toBe("Сто тенге 01 тиын");
    expect(tengeAmountToWords(100.02)).toBe("Сто тенге 02 тиына");
  });

  it("нулевая сумма", () => {
    expect(tengeAmountToWords(0)).toBe("Ноль тенге 00 тиынов");
  });
});
