import { readFileSync } from "node:fs";
import path from "node:path";
import { numberToWordsKZT } from "@/lib/invoice/calc";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

let fontFaceCssCache: string | null = null;

/**
 * На Vercel (Linux-серверлесс) системного Times New Roman нет — встраиваем
 * настоящие файлы шрифта (те же, что у АВР) как data: URI.
 */
function getFontFaceCss(): string {
  if (fontFaceCssCache) return fontFaceCssCache;
  const fontsDir = path.join(process.cwd(), "public", "fonts");
  const regular = readFileSync(path.join(fontsDir, "timesnewromanpsmt.ttf")).toString("base64");
  const bold = readFileSync(path.join(fontsDir, "timesnewromanbold.ttf")).toString("base64");
  const italic = readFileSync(path.join(fontsDir, "timesnewromanitalic.ttf")).toString("base64");
  fontFaceCssCache = `
    @font-face {
      font-family: "TimesNewRomanReal";
      src: url(data:font/ttf;base64,${regular}) format("truetype");
      font-weight: normal;
      font-style: normal;
    }
    @font-face {
      font-family: "TimesNewRomanReal";
      src: url(data:font/ttf;base64,${bold}) format("truetype");
      font-weight: bold;
      font-style: normal;
    }
    @font-face {
      font-family: "TimesNewRomanReal";
      src: url(data:font/ttf;base64,${italic}) format("truetype");
      font-weight: normal;
      font-style: italic;
    }
  `;
  return fontFaceCssCache;
}

export interface WaybillHtmlData {
  binIin: string;
  companyName: string;
  accountantName: string;
  documentNumber: string;
  documentDate: string;
  senderName: string;
  recipientName: string;
  responsiblePerson: string;
  transportOrganization: string;
  transportDocument: string;
  items: {
    name: string;
    nomenclatureNumber: string;
    unit: string;
    quantityToRelease: number;
    quantityReleased: number;
    price: number;
    sumWithVat: number;
    vatSum: number;
  }[];
  poaNumber: string;
  poaDate: string;
  poaIssuedTo: string;
  signatureImageBase64?: string;
  stampImageBase64?: string;
}

function fmt(n: number): string {
  return n.toLocaleString("ru-KZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function generateWaybillHtml(data: WaybillHtmlData): string {
  const totalSumWithVat = data.items.reduce((sum, item) => sum + item.sumWithVat, 0);

  const rows = data.items
    .map(
      (item, idx) => `
      <tr>
        <td class="center">${idx + 1}</td>
        <td>${escapeHtml(item.name)}</td>
        <td class="center">${escapeHtml(item.nomenclatureNumber)}</td>
        <td class="center">${escapeHtml(item.unit)}</td>
        <td class="right">${fmt(item.quantityToRelease)}</td>
        <td class="right">${fmt(item.quantityReleased)}</td>
        <td class="right">${fmt(item.price)}</td>
        <td class="right">${fmt(item.sumWithVat)}</td>
        <td class="right">${fmt(item.vatSum)}</td>
      </tr>`
    )
    .join("");

  const signatureImg = data.signatureImageBase64
    ? `<img src="${data.signatureImageBase64}" class="signature-img">`
    : "";
  const stampImg = data.stampImageBase64 ? `<img src="${data.stampImageBase64}" class="stamp-img">` : "";

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<style>
  ${getFontFaceCss()}

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: "TimesNewRomanReal", "Times New Roman", Times, serif;
    font-size: 9pt;
    color: #000;
    background: #fff;
  }

  .page {
    width: 277mm;
    min-height: 190mm;
    padding: 8mm 10mm;
  }

  .header { display: flex; justify-content: flex-end; margin-bottom: 4px; }
  .header-right {
    text-align: right;
    font-size: 8pt;
    font-style: italic;
    line-height: 1.3;
  }
  .form-code { font-weight: bold; font-size: 9pt; font-style: normal; }

  .org-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 18px;
  }
  .org-value {
    flex: 1;
    border-bottom: 1px solid #000;
    font-weight: bold;
  }
  .bin-box {
    border: 1px solid #000;
    min-width: 130px;
    padding: 2px 6px;
    text-align: center;
  }

  .doc-number-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 10px;
  }
  .title {
    font-size: 12pt;
    font-weight: normal;
    text-align: center;
    margin-bottom: 18px;
  }
  .doc-number-box { border: 1px solid #000; }
  .doc-number-box table { border-collapse: collapse; }
  .doc-number-box td {
    border: 1px solid #000;
    padding: 2px 8px;
    text-align: center;
    min-width: 80px;
  }
  .doc-number-box .header-cell { font-size: 7.5pt; border-bottom: 1px solid #000; }
  .doc-number-box .value-cell { font-size: 9pt; min-height: 16px; padding: 5px 8px; }

  table.parties {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
    margin-bottom: 18px;
  }
  table.parties th, table.parties td {
    border: 1px solid #000;
    padding: 4px 5px;
  }
  table.parties th { font-weight: bold; text-align: center; font-size: 7.5pt; }
  table.parties td { min-height: 24px; }

  table.main {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
    margin-bottom: 14px;
  }
  table.main th, table.main td {
    border: 1px solid #000;
    padding: 3px 4px;
    vertical-align: middle;
    font-weight: normal;
  }
  table.main th { font-weight: bold; text-align: center; font-size: 7.5pt; line-height: 1.2; }
  table.main td.center { text-align: center; }
  table.main td.right { text-align: right; }
  table.main .col-num    { width: 32px; }
  table.main .col-name   { width: auto; }
  table.main .col-nomen  { width: 80px; }
  table.main .col-unit   { width: 60px; }
  table.main .col-qty    { width: 70px; }
  table.main .col-price  { width: 80px; }
  table.main .col-sum    { width: 90px; }

  .totals-line { margin-bottom: 24px; }

  .signature-grid {
    display: flex;
  }
  .signature-half { flex: 1; }
  .signature-half:first-child {
    border-right: 1px solid #000;
    padding-right: 20px;
  }
  .signature-half:last-child {
    padding-left: 20px;
  }
  .signature-field-row {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    margin-top: 24px;
  }
  .signature-slot {
    flex: 1;
    position: relative;
    overflow: visible;
    border-bottom: 1px solid #000;
    min-height: 24px;
  }
  .signature-field-row-accountant {
    margin-top: 50px;
  }
  .signature-overlay {
    position: absolute;
    left: 50%;
    bottom: -4px;
    transform: translateX(-50%);
    z-index: -1;
  }
  .signature-img { height: 50px; }
  .stamp-overlay {
    position: absolute;
    left: 50%;
    bottom: -20px;
    transform: translateX(-50%);
    z-index: -1;
  }
  .stamp-img { height: 115px; opacity: 0.75; }
  .caption {
    font-size: 7pt;
    font-style: italic;
    color: #444;
    margin-top: 4px;
  }
  .mp-label { margin-top: 16px; }

  @media print {
    body { -webkit-print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-right">
      Приложение 26<br>
      к приказу Министра финансов<br>
      Республики Казахстан<br>
      от 20.12.2012 года № 562<br>
      <span class="form-code">Форма З-2</span>
    </div>
  </div>

  <div class="org-row">
    <span>Организация (индивидуальный предприниматель)</span>
    <span class="org-value">${escapeHtml(data.companyName)}</span>
    <span>ИИН/БИН</span>
    <span class="bin-box">${escapeHtml(data.binIin)}</span>
  </div>

  <div class="doc-number-row">
    <div class="doc-number-box">
      <table>
        <tr>
          <td class="header-cell">Номер документа</td>
          <td class="header-cell">Дата составления</td>
        </tr>
        <tr>
          <td class="value-cell">${escapeHtml(data.documentNumber)}</td>
          <td class="value-cell">${escapeHtml(data.documentDate)}</td>
        </tr>
      </table>
    </div>
  </div>

  <div class="title">НАКЛАДНАЯ НА ОТПУСК ЗАПАСОВ НА СТОРОНУ</div>

  <table class="parties">
    <tr>
      <th>Организация (индивидуальный предприниматель) — отправитель</th>
      <th>Организация (индивидуальный предприниматель) — получатель</th>
      <th>Ответственный за поставку (Ф.И.О.)</th>
      <th>Транспортная организация</th>
      <th>Товарно-транспортная накладная (номер, дата)</th>
    </tr>
    <tr>
      <td>${escapeHtml(data.senderName || data.companyName)}</td>
      <td>${escapeHtml(data.recipientName)}</td>
      <td>${escapeHtml(data.responsiblePerson)}</td>
      <td>${escapeHtml(data.transportOrganization)}</td>
      <td>${escapeHtml(data.transportDocument)}</td>
    </tr>
  </table>

  <table class="main">
    <thead>
      <tr>
        <th class="col-num" rowspan="2">Номер по порядку</th>
        <th class="col-name" rowspan="2">Наименование, характеристика</th>
        <th class="col-nomen" rowspan="2">Номенклатурный номер</th>
        <th class="col-unit" rowspan="2">Единица измерения</th>
        <th colspan="2">Количество</th>
        <th class="col-price" rowspan="2">Цена за единицу, в тенге</th>
        <th class="col-sum" rowspan="2">Сумма с НДС, в тенге</th>
        <th class="col-sum" rowspan="2">Сумма НДС, в тенге</th>
      </tr>
      <tr>
        <th class="col-qty">подлежит отпуску</th>
        <th class="col-qty">отпущено</th>
      </tr>
      <tr>
        <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="totals-line">
    Всего отпущено количество запасов (прописью) ___________________ на сумму (прописью), в тенге
    ${escapeHtml(numberToWordsKZT(totalSumWithVat))}
  </div>

  <div class="signature-grid">
    <div class="signature-half">
      <div class="signature-field-row">
        <span>Отпуск разрешил</span>
        <span class="signature-slot"></span>
      </div>
      <div class="caption">должность · подпись · расшифровка подписи</div>

      <div class="signature-field-row signature-field-row-accountant">
        <span>Главный бухгалтер</span>
        <span class="signature-slot">
          <span class="signature-overlay">${signatureImg}</span>
          <span class="stamp-overlay">${stampImg}</span>
        </span>
      </div>
      <div class="caption">/ ${escapeHtml(data.accountantName || "—")} /</div>
      <div class="mp-label">М.П.</div>

      <div class="signature-field-row">
        <span>Отпустил</span>
        <span class="signature-slot"></span>
      </div>
    </div>

    <div class="signature-half">
      <div>По доверенности № ${escapeHtml(data.poaNumber || "—")} от «${escapeHtml(data.poaDate || "___")}» года</div>
      <div style="margin-top:4px;">выданной ${escapeHtml(data.poaIssuedTo)}</div>

      <div class="signature-field-row" style="margin-top: 40px;">
        <span>Запасы получил</span>
        <span class="signature-slot"></span>
      </div>
      <div class="caption">подпись · расшифровка подписи</div>
    </div>
  </div>

</div>
</body>
</html>`;
}
