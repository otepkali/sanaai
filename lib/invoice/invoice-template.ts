import { readFileSync } from "node:fs";
import path from "node:path";
import { formatDateLong } from "@/lib/format";
import { calculateInvoiceTotals, formatMoney } from "./calc";
import type { InvoiceData } from "./types";

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
 * настоящие файлы шрифта (те же, что у АВР/Доверенности/Накладной) как
 * data: URI.
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

const DISCLAIMER_TEXT =
  "Внимание! Оплата данного счета означает согласие с условиями поставки товара. Уведомление об оплате обязательно, в противном случае не гарантируется наличие товара на складе. Товар отпускается по факту прихода денег на р/с Поставщика, самовывозом, при наличии доверенности и документов удостоверяющих личность.";

function formatPartyValue(party: { binIin: string; name: string; address?: string }): string {
  const parts = [`БИН/ИИН ${party.binIin || "—"}`, party.name || "—"];
  if (party.address) parts.push(party.address);
  return parts.join(", ");
}

export function generateInvoiceHtml(data: InvoiceData): string {
  const result = calculateInvoiceTotals(data);
  const { beneficiary } = data;

  const rows = result.lines
    .map(
      (line, index) => `
      <tr>
        <td class="center">${index + 1}</td>
        <td>${escapeHtml(line.code || "—")}</td>
        <td>${escapeHtml(line.name || "—")}</td>
        <td class="right">${formatMoney(line.qty)}</td>
        <td class="center">${escapeHtml(line.unit)}</td>
        <td class="right">${formatMoney(line.price)}</td>
        <td class="right">${formatMoney(line.lineTotal)}</td>
      </tr>`
    )
    .join("");

  const taxBlock = data.showTaxBlock
    ? `
    <div class="tax-section">
      <div class="section-label">Налоговый блок (справка-расчёт)</div>
      ${
        result.vatAmount !== null
          ? `<div class="tax-row"><span>НДС (16%):</span><span>${formatMoney(result.vatAmount)}</span></div>`
          : ""
      }
      <div class="tax-row">
        <span>Налогооблагаемый доход (сумма без НДС − расходы):</span>
        <span>${formatMoney(result.taxableIncome)}</span>
      </div>
      <div class="tax-row tax-row-bold">
        <span>ИПН (10% от прибыли):</span>
        <span>${formatMoney(result.ipnAmount ?? 0)}</span>
      </div>
      <div class="tax-footnote">
        Итоговый ИПН рассчитывается по итогам налогового периода на основе всех фактических
        вычетов. Расчёт выше — иллюстративная оценка по одной сделке.
      </div>
    </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<style>
  ${getFontFaceCss()}

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: "TimesNewRomanReal", "Times New Roman", Times, serif;
    font-size: 10.5pt;
    color: #000;
    background: #fff;
  }

  .page {
    width: 190mm;
    min-height: 270mm;
    padding: 16mm 14mm;
  }

  .disclaimer {
    font-size: 8.5pt;
    text-align: center;
    margin: 0 50px 14px;
    line-height: 1.3;
  }

  .section-label {
    font-size: 10.5pt;
    font-weight: bold;
    margin-bottom: 3px;
  }

  table.payment {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
  }
  table.payment td {
    border: 1px solid #000;
    padding: 4px;
    vertical-align: top;
  }
  table.payment .wide { width: 50%; }
  table.payment .narrow { width: 25%; text-align: center; }
  .cell-caption { font-weight: bold; margin-bottom: 2px; }
  .cell-value-bold { font-weight: bold; }

  .title { font-size: 15pt; font-weight: bold; margin-bottom: 10px; }

  .party-row { display: flex; gap: 4px; margin-bottom: 3px; }
  .party-label { width: 90px; flex-shrink: 0; }
  .party-value { flex: 1; font-weight: bold; }

  table.items {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    font-size: 9.5pt;
  }
  table.items th, table.items td {
    border: 1px solid #000;
    padding: 3px 4px;
  }
  table.items th { font-weight: bold; text-align: center; font-size: 9.5pt; }
  table.items td.center { text-align: center; }
  table.items td.right { text-align: right; }
  table.items .col-num   { width: 24px; }
  table.items .col-code  { width: 70px; }
  table.items .col-name  { width: auto; }
  table.items .col-qty   { width: 56px; }
  table.items .col-unit  { width: 44px; }
  table.items .col-price { width: 80px; }
  table.items .col-sum   { width: 90px; }

  .totals-block { margin-top: 6px; display: flex; flex-direction: column; align-items: flex-end; }
  .totals-row {
    display: flex;
    justify-content: space-between;
    width: 240px;
    font-weight: bold;
    margin-bottom: 2px;
  }
  .summary-line { margin-top: 10px; }
  .amount-in-words { margin-top: 2px; font-weight: bold; }

  .tax-section {
    margin-top: 26px;
    padding-top: 10px;
    border-top: 1px solid #999;
  }
  .tax-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
  .tax-row-bold { font-weight: bold; }
  .tax-footnote { margin-top: 6px; font-size: 8.5pt; color: #555; line-height: 1.3; }

  .signature-row {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    margin-top: 40px;
  }
  .signature-line {
    flex: 1;
    border-bottom: 1px solid #000;
    min-height: 16px;
  }

  @media print {
    body { -webkit-print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">

  <div class="disclaimer">${escapeHtml(DISCLAIMER_TEXT)}</div>

  <div class="section-label">Образец платежного поручения</div>
  <table class="payment">
    <tr>
      <td class="wide">
        <div class="cell-caption">Бенефициар:</div>
        <div class="cell-value-bold">${escapeHtml(beneficiary.name || "—")}</div>
        <div>ИИН: ${escapeHtml(beneficiary.iin || "—")}</div>
      </td>
      <td class="narrow">
        <div class="cell-caption">ИИК</div>
        <div class="cell-value-bold">${escapeHtml(beneficiary.iik || "—")}</div>
      </td>
      <td class="narrow">
        <div class="cell-caption">Кбе</div>
        <div class="cell-value-bold">${escapeHtml(beneficiary.kbe || "—")}</div>
      </td>
    </tr>
    <tr>
      <td class="wide">
        <div class="cell-caption">Банк бенефициара:</div>
        <div>${escapeHtml(beneficiary.bankName || "—")}</div>
      </td>
      <td class="narrow">
        <div class="cell-caption">БИК</div>
        <div class="cell-value-bold">${escapeHtml(beneficiary.bik || "—")}</div>
      </td>
      <td class="narrow">
        <div class="cell-caption">Код назначения платежа</div>
        <div class="cell-value-bold">${escapeHtml(beneficiary.knp || "—")}</div>
      </td>
    </tr>
  </table>

  <div class="title">Счёт на оплату № ${escapeHtml(data.number || "—")} от ${escapeHtml(formatDateLong(data.date))}</div>

  <div class="party-row">
    <span class="party-label">Поставщик:</span>
    <span class="party-value">${escapeHtml(formatPartyValue(data.supplier))}</span>
  </div>
  <div class="party-row">
    <span class="party-label">Покупатель:</span>
    <span class="party-value">${escapeHtml(formatPartyValue(data.buyer))}</span>
  </div>
  <div class="party-row">
    <span class="party-label">Договор:</span>
    <span class="party-value">${escapeHtml(data.contract || "Без договора")}</span>
  </div>

  <table class="items">
    <thead>
      <tr>
        <th class="col-num">№</th>
        <th class="col-code">Код</th>
        <th class="col-name">Наименование</th>
        <th class="col-qty">Кол-во</th>
        <th class="col-unit">Ед.</th>
        <th class="col-price">Цена</th>
        <th class="col-sum">Сумма</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="totals-block">
    <div class="totals-row"><span>Итого:</span><span>${formatMoney(result.subtotal)}</span></div>
    ${
      result.vatAmount !== null
        ? `<div class="totals-row"><span>${result.vatMode === "exclusive" ? "Кроме того НДС:" : "В том числе НДС:"}</span><span>${formatMoney(result.vatAmount)}</span></div>`
        : ""
    }
    ${
      result.vatMode === "exclusive" && result.vatAmount !== null
        ? `<div class="totals-row"><span>Всего с НДС:</span><span>${formatMoney(result.grossAmount)}</span></div>`
        : ""
    }
  </div>

  <div class="summary-line">
    Всего наименований ${result.itemsCount}, на сумму ${formatMoney(result.grossAmount)} KZT
  </div>
  <div class="amount-in-words">Всего к оплате: ${escapeHtml(result.amountInWords)}</div>

  ${taxBlock}

  <div class="signature-row">
    <span>Исполнитель</span>
    <span class="signature-line"></span>
    <span>/Руководитель/</span>
  </div>

</div>
</body>
</html>`;
}
