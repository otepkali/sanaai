import { readFileSync } from "node:fs";
import path from "node:path";

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
 * На Vercel (Linux-серверлесс) системного Arial нет — встраиваем настоящие
 * файлы шрифта (добавлены по решению пользователя, на свою ответственность
 * по лицензии Microsoft) как data: URI, аналогично Times New Roman у АВР.
 */
function getFontFaceCss(): string {
  if (fontFaceCssCache) return fontFaceCssCache;
  const fontsDir = path.join(process.cwd(), "public", "fonts");
  const regular = readFileSync(path.join(fontsDir, "arial.ttf")).toString("base64");
  const bold = readFileSync(path.join(fontsDir, "arialbd.ttf")).toString("base64");
  const italic = readFileSync(path.join(fontsDir, "ariali.ttf")).toString("base64");
  fontFaceCssCache = `
    @font-face {
      font-family: "ArialReal";
      src: url(data:font/ttf;base64,${regular}) format("truetype");
      font-weight: normal;
      font-style: normal;
    }
    @font-face {
      font-family: "ArialReal";
      src: url(data:font/ttf;base64,${bold}) format("truetype");
      font-weight: bold;
      font-style: normal;
    }
    @font-face {
      font-family: "ArialReal";
      src: url(data:font/ttf;base64,${italic}) format("truetype");
      font-weight: normal;
      font-style: italic;
    }
  `;
  return fontFaceCssCache;
}

export interface PoaHtmlData {
  binIin: string;
  companyName: string;
  directorName: string;
  accountantName: string;
  poaNumber: string;
  issueDate: string;
  validUntilRecipient: string;
  validUntilPayer: string;
  bankAccount: string;
  bankName: string;
  issuedToPosition: string;
  issuedToName: string;
  idDocumentSeries: string;
  idDocumentNumber: string;
  idDocumentDate: string;
  idDocumentIssuedBy: string;
  supplierName: string;
  documentBasis: string;
  items: {
    name: string;
    unit: string;
    quantityInWords: string;
  }[];
  signatureImageBase64?: string;
  stampImageBase64?: string;
}

export function generatePoaHtml(data: PoaHtmlData): string {
  const rows = data.items
    .map(
      (item, idx) => `
      <tr>
        <td class="center">${idx + 1}</td>
        <td>${escapeHtml(item.name)}</td>
        <td class="center">${escapeHtml(item.unit)}</td>
        <td>${escapeHtml(item.quantityInWords)}</td>
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
    font-family: "ArialReal", Arial, sans-serif;
    font-size: 9pt;
    color: #000;
    background: #fff;
  }

  .page {
    width: 277mm;
    min-height: 190mm;
    padding: 8mm 10mm;
  }

  .header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 4px;
  }
  .header-right {
    text-align: right;
    font-size: 8pt;
    font-style: italic;
    line-height: 1.3;
  }
  .form-code {
    font-weight: bold;
    font-size: 9pt;
    font-style: normal;
  }

  .org-row {
    display: flex;
    align-items: baseline;
    margin-bottom: 14px;
    gap: 6px;
  }
  .org-value {
    flex: 1;
    border-bottom: 1px solid #000;
    font-weight: bold;
  }
  .bin-box {
    border: 1px solid #000;
    min-width: 140px;
    padding: 2px 6px;
    text-align: center;
  }

  .field-label { margin-bottom: 1px; }
  .field-line {
    border-bottom: 1px solid #000;
    min-height: 16px;
    margin-bottom: 1px;
  }
  .caption {
    font-size: 7pt;
    font-style: italic;
    color: #444;
    text-align: center;
    margin-bottom: 10px;
  }

  .bank-row {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-bottom: 1px;
  }
  .bank-value {
    flex: 1;
    border-bottom: 1px solid #000;
  }

  .title {
    font-size: 13pt;
    font-weight: bold;
    text-align: center;
    margin-top: 10px;
  }
  .date-issue {
    text-align: center;
    margin-bottom: 12px;
  }

  .inline-row {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-bottom: 1px;
  }
  .inline-value {
    flex: 1;
    border-bottom: 1px solid #000;
  }
  .id-row {
    display: flex;
    gap: 12px;
    margin-bottom: 1px;
  }

  table.main {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
    margin-top: 14px;
    margin-bottom: 4px;
  }
  table.main th,
  table.main td {
    border: 1px solid #000;
    padding: 4px 5px;
    vertical-align: middle;
    font-weight: normal;
  }
  table.main th {
    font-weight: bold;
    text-align: center;
    font-size: 8pt;
  }
  table.main td.center { text-align: center; }
  table.main .col-num  { width: 60px; }
  table.main .col-name { width: auto; }
  table.main .col-unit { width: 110px; }
  table.main .col-qty  { width: 180px; }
  table.main .total-row td { font-weight: bold; }

  .signature-section { margin-top: 24px; }
  .signature-recipient-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    margin-bottom: 24px;
  }
  .signature-recipient-line {
    flex: 1;
    border-bottom: 1px solid #000;
    min-height: 20px;
  }
  .certify-label { margin-bottom: 16px; }
  .certify-row {
    display: flex;
    gap: 30px;
    margin-top: 36px;
  }
  .certify-half { flex: 1; }
  .certify-role-caption {
    font-size: 7.5pt;
    color: #444;
  }
  .signature-field-row {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    margin-top: 40px;
  }
  .mp-label {
    font-size: 9pt;
    white-space: nowrap;
  }
  .signature-slot {
    flex: 1;
    position: relative;
    overflow: visible;
    border-bottom: 1px solid #000;
    min-height: 24px;
  }
  .signature-overlay {
    position: absolute;
    left: 50%;
    bottom: -4px;
    transform: translateX(-50%);
    z-index: -1;
  }
  .signature-img {
    height: 60px;
  }
  .stamp-overlay {
    position: absolute;
    left: 50%;
    bottom: -25px;
    transform: translateX(-50%);
    z-index: -1;
  }
  .stamp-img {
    height: 140px;
    opacity: 0.75;
  }

  @media print {
    body { -webkit-print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-right">
      Приложение 6<br>
      к приказу Министра финансов Республики Казахстан<br>
      от 20 декабря 2012 года № 562<br>
      <span class="form-code">Форма Д-1</span>
    </div>
  </div>

  <div class="org-row">
    <span>Организация (индивидуальный предприниматель)</span>
    <span class="org-value">${escapeHtml(data.companyName)}</span>
    <span>ИИН/БИН</span>
    <span class="bin-box">${escapeHtml(data.binIin)}</span>
  </div>

  <div class="field-label">Доверенность действительна по</div>
  <div class="field-line">${escapeHtml(data.validUntilRecipient)}</div>
  <div class="caption">наименование получателя, ИИН/БИН и его адрес</div>

  <div class="field-line">${escapeHtml(data.validUntilPayer)}</div>
  <div class="caption">наименование плательщика, ИИН/БИН и его адрес</div>

  <div class="bank-row">
    <span>Счёт №</span>
    <span class="bank-value">${escapeHtml(data.bankAccount)}</span>
    <span>в</span>
    <span class="bank-value">${escapeHtml(data.bankName)}</span>
  </div>
  <div class="caption">наименование банка</div>

  <div class="title">ДОВЕРЕННОСТЬ № ${escapeHtml(data.poaNumber || "—")}</div>
  <div class="date-issue">Дата выдачи ${escapeHtml(data.issueDate || "—")}</div>

  <div class="inline-row">
    <span>Выдана</span>
    <span class="inline-value">${escapeHtml(data.issuedToPosition)}, ${escapeHtml(data.issuedToName)}</span>
  </div>
  <div class="caption">должность, фамилия, имя, отчество</div>

  <div class="id-row">
    <span>Удостоверение личности (паспорт) серии ${escapeHtml(data.idDocumentSeries || "—")}</span>
    <span>№ ${escapeHtml(data.idDocumentNumber || "—")}</span>
    <span>от ${escapeHtml(data.idDocumentDate || "—")}</span>
  </div>
  <div class="inline-row">
    <span>выдан</span>
    <span class="inline-value">${escapeHtml(data.idDocumentIssuedBy)}</span>
  </div>
  <div class="caption">кем выдано удостоверение (паспорт) и когда</div>

  <div class="inline-row">
    <span>На получение от</span>
    <span class="inline-value">${escapeHtml(data.supplierName)}</span>
  </div>
  <div class="caption">наименование поставщика</div>

  <div class="inline-row">
    <span>активов по</span>
    <span class="inline-value">${escapeHtml(data.documentBasis)}</span>
  </div>
  <div class="caption">наименование, номер и дата документа</div>

  <table class="main">
    <thead>
      <tr>
        <th class="col-num">Номер по порядку</th>
        <th class="col-name">Наименование активов</th>
        <th class="col-unit">Единица измерения</th>
        <th class="col-qty">Количество (прописью)</th>
      </tr>
      <tr>
        <th>1</th><th>2</th><th>3</th><th>4</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td></td>
        <td></td>
        <td class="center">Итого</td>
        <td></td>
      </tr>
    </tfoot>
  </table>

  <div class="signature-section">
    <div class="signature-recipient-row">
      <span>Подпись лица, получившего доверенность</span>
      <span class="signature-recipient-line"></span>
    </div>

    <div class="certify-label">удостоверяем:</div>

    <div class="certify-row">
      <div class="certify-half">
        <div>Руководитель организации</div>
        <div class="certify-role-caption">(индивидуальный предприниматель)</div>
        <div class="signature-field-row">
          <span class="mp-label">М.П.</span>
          <span class="signature-slot">
            <span class="signature-overlay">${signatureImg}</span>
            <span class="stamp-overlay">${stampImg}</span>
          </span>
          <span>/ ${escapeHtml(data.directorName || "—")} /</span>
        </div>
      </div>
      <div class="certify-half">
        <div>Главный бухгалтер</div>
        <div class="signature-field-row">
          <span class="signature-slot"></span>
          <span>/ ${escapeHtml(data.accountantName || "—")} /</span>
        </div>
      </div>
    </div>
  </div>

</div>
</body>
</html>`;
}
