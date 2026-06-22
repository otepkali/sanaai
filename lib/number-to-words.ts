type PluralForms = readonly [singular: string, plural2to4: string, plural5plus: string];

const ONES_MALE = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
const ONES_FEMALE = ["", "одна", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
const TEENS = [
  "десять",
  "одиннадцать",
  "двенадцать",
  "тринадцать",
  "четырнадцать",
  "пятнадцать",
  "шестнадцать",
  "семнадцать",
  "восемнадцать",
  "девятнадцать",
];
const TENS = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
const HUNDREDS = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];

const SCALES: readonly PluralForms[] = [
  ["", "", ""],
  ["тысяча", "тысячи", "тысяч"],
  ["миллион", "миллиона", "миллионов"],
  ["миллиард", "миллиарда", "миллиардов"],
  ["триллион", "триллиона", "триллионов"],
];

const TIYN_FORMS: PluralForms = ["тиын", "тиына", "тиынов"];

function pluralForm(n: number, forms: PluralForms): string {
  const hundredRem = n % 100;
  const tenRem = n % 10;
  if (hundredRem >= 11 && hundredRem <= 14) return forms[2];
  if (tenRem === 1) return forms[0];
  if (tenRem >= 2 && tenRem <= 4) return forms[1];
  return forms[2];
}

function tripletToWords(n: number, female: boolean): string[] {
  const words: string[] = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds > 0) words.push(HUNDREDS[hundreds]);

  if (rest >= 10 && rest <= 19) {
    words.push(TEENS[rest - 10]);
  } else {
    const tens = Math.floor(rest / 10);
    const ones = rest % 10;
    if (tens > 0) words.push(TENS[tens]);
    if (ones > 0) words.push((female ? ONES_FEMALE : ONES_MALE)[ones]);
  }
  return words;
}

/** Переводит целое неотрицательное число в слова (русский язык), например 1234 → "одна тысяча двести тридцать четыре" */
export function numberToWordsRu(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return "ноль";

  const triplets: number[] = [];
  let rest = n;
  while (rest > 0) {
    triplets.push(rest % 1000);
    rest = Math.floor(rest / 1000);
  }

  const parts: string[] = [];
  for (let scale = triplets.length - 1; scale >= 0; scale--) {
    const triplet = triplets[scale];
    if (triplet === 0) continue;

    const isThousands = scale === 1;
    parts.push(...tripletToWords(triplet, isThousands));
    if (scale > 0) {
      parts.push(pluralForm(triplet, SCALES[scale]));
    }
  }

  return parts.join(" ");
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Переводит денежную сумму в тенге в текстовую форму «прописью», например 1234.5 → "Одна тысяча двести тридцать четыре тенге 50 тиынов" */
export function tengeAmountToWords(amount: number): string {
  const safeAmount = Math.max(0, amount);
  const tenge = Math.floor(safeAmount);
  const tiyn = Math.round((safeAmount - tenge) * 100);

  const tengeWords = capitalize(numberToWordsRu(tenge));
  const tiynLabel = pluralForm(tiyn, TIYN_FORMS);

  return `${tengeWords} тенге ${String(tiyn).padStart(2, "0")} ${tiynLabel}`;
}
