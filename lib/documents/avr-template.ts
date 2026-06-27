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
 * На Vercel (Linux-серверлесс) системного Times New Roman нет — встраиваем
 * настоящие файлы шрифта (добавлены пользователем, на свою ответственность
 * по лицензии Microsoft) как data: URI, чтобы Chromium гарантированно
 * рисовал тот же шрифт локально и в проде, независимо от ОС.
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

export interface AvrHtmlData {
  binIin: string;
  customerBinIin?: string;
  customerName: string;
  customerAddress: string;
  executorName: string;
  executorAddress: string;
  contractNumber?: string;
  contractDate?: string;
  documentNumber: string;
  documentDate: string;
  periodFrom?: string;
  periodTo?: string;
  items: {
    name: string;
    reportInfo?: string;
    unit: string;
    quantity: number;
    price: number;
  }[];
  reservesInfo?: string;
  attachmentNote?: string;
  executorPosition?: string;
  executorSignatureName?: string;
  customerPosition?: string;
  customerSignatureName?: string;
  signatureImageBase64?: string;
  stampImageBase64?: string;
}

export function generateAvrHtml(data: AvrHtmlData): string {
  const total = data.items.reduce((s, i) => s + i.quantity * i.price, 0);

  const fmt = (n: number) => n.toLocaleString("ru-KZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const rows = data.items
    .map(
      (item, idx) => `
      <tr>
        <td class="center">${idx + 1}</td>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.reportInfo ?? "")}</td>
        <td class="center">${escapeHtml(item.unit)}</td>
        <td class="right">${item.quantity}</td>
        <td class="right">${fmt(item.price)}</td>
        <td class="right">${fmt(item.quantity * item.price)}</td>
      </tr>`
    )
    .join("");

  const signatureImg = data.signatureImageBase64
    ? `<img src="${data.signatureImageBase64}" class="signature-img">`
    : "";

  const stampImg = data.stampImageBase64
    ? `<img src="${data.stampImageBase64}" class="stamp-img">`
    : "";

  const customerLine = [escapeHtml(data.customerName), escapeHtml(data.customerAddress)]
    .filter(Boolean)
    .join(", ");
  const executorLine = [escapeHtml(data.executorName), escapeHtml(data.executorAddress)]
    .filter(Boolean)
    .join(", ");

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

  /* Шапка */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 4px;
  }
  .header-left { flex: 1; }
  .header-right {
    text-align: right;
    font-size: 8pt;
    font-style: italic;
    line-height: 1.3;
    white-space: nowrap;
  }
  .form-code {
    font-weight: bold;
    font-size: 9pt;
    font-style: normal;
  }

  /* Реквизиты сторон */
  .party-row {
    display: flex;
    align-items: flex-start;
    margin-bottom: 10px;
  }
  .party-label {
    font-weight: bold;
    white-space: nowrap;
    margin-right: 4px;
    min-width: 62px;
  }
  .party-value-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .party-value {
    display: block;
    min-height: 13px;
    border-bottom: 1px solid #000;
    padding-bottom: 1px;
    margin-bottom: 4px;
    font-size: 8.5pt;
    font-weight: bold;
  }
  .party-bin {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: 10px;
    white-space: nowrap;
  }
  .party-bin-label {
    font-size: 8pt;
    font-weight: bold;
  }
  .party-bin-box {
    border: 1px solid #000;
    min-width: 110px;
    padding: 1px 4px;
    font-size: 9pt;
    text-align: center;
  }
  .sub-caption {
    font-size: 7pt;
    font-style: italic;
    color: #444;
    text-align: center;
    margin-bottom: 3px;
  }

  /* Договор + заголовок АКТ */
  .contract-title-row {
    display: flex;
    align-items: flex-start;
    margin: 14px 0 12px;
    gap: 8px;
  }
  .contract-part {
    display: flex;
    align-items: baseline;
    gap: 4px;
    white-space: nowrap;
    font-size: 8.5pt;
  }
  .contract-value {
    border-bottom: 1px solid #000;
    padding-bottom: 1px;
    min-width: 260px;
  }
  .act-title {
    flex: 1;
    text-align: center;
    font-weight: bold;
    font-size: 10pt;
    padding-top: 12px;
  }
  .doc-number-box {
    border: 1px solid #000;
    border-collapse: collapse;
    font-size: 8pt;
    white-space: nowrap;
  }
  .doc-number-box table {
    border-collapse: collapse;
  }
  .doc-number-box td {
    border: 1px solid #000;
    padding: 1px 4px;
    text-align: center;
    min-width: 52px;
  }
  .doc-number-box .header-cell {
    font-size: 7pt;
    border-bottom: 1px solid #000;
    background: #fff;
  }
  .doc-number-box .value-cell {
    font-size: 9pt;
    min-height: 14px;
  }

  /* Сведения о запасах */
  .reserves-row {
    display: flex;
    align-items: baseline;
    margin: 3px 0 1px;
    font-size: 8.5pt;
  }
  .reserves-value {
    flex: 1;
    border-bottom: 1px solid #000;
    margin-left: 4px;
  }
  .reserves-caption {
    font-size: 7pt;
    font-style: italic;
    color: #444;
    text-align: center;
    margin-bottom: 3px;
  }
  .attachment-text {
    font-size: 8pt;
    margin-bottom: 55px;
  }

  /* Таблица */
  table.main {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
    margin-bottom: 14px;
  }
  table.main th,
  table.main td {
    border: 1px solid #000;
    padding: 2px 3px;
    vertical-align: middle;
  }
  table.main th {
    font-weight: bold;
    text-align: center;
    background: #fff;
    font-size: 7.5pt;
    line-height: 1.2;
  }
  table.main td {
    font-weight: normal;
  }
  table.main td.center { text-align: center; }
  table.main td.right  { text-align: right; }
  table.main .col-num    { width: 22px; }
  table.main .col-name   { width: auto; }
  table.main .col-report { width: 100px; }
  table.main .col-unit   { width: 34px; }
  table.main .col-qty    { width: 38px; }
  table.main .col-price  { width: 72px; }
  table.main .col-sum    { width: 78px; }

  /* Блок подписей */
  .signatures {
    display: flex;
    gap: 0;
    margin-top: 10px;
  }
  .sig-half {
    flex: 1;
    font-size: 8.5pt;
  }
  .sig-half:first-child {
    border-right: none;
    padding-right: 12px;
  }
  .sig-line {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    margin-bottom: 6px;
  }
  .sig-underline {
    flex: 1;
    border-bottom: 1px solid #000;
    min-height: 20px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 1px;
  }
  .sig-underline-signature {
    position: relative;
    overflow: visible;
  }
  .signature-overlay {
    position: absolute;
    left: 50%;
    bottom: -6px;
    transform: translateX(-50%);
    z-index: -1;
  }
  .signature-img {
    height: 70px;
  }
  .stamp-overlay {
    position: absolute;
    left: 50%;
    bottom: -30px;
    transform: translateX(-50%);
    z-index: -1;
  }
  .stamp-img {
    height: 150px;
    opacity: 0.75;
  }
  .sig-caption {
    font-size: 7pt;
    font-style: italic;
    color: #444;
    margin-bottom: 14px;
  }
  .stamp-sig-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
  }
  .date-line {
    font-size: 8.5pt;
    margin-top: 14px;
  }
  .mp-label { font-size: 9pt; white-space: nowrap; }

  @media print {
    body { -webkit-print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- ШАПКА -->
  <div class="header">
    <div class="header-left">
      <!-- пусто, всё содержимое правее -->
    </div>
    <div class="header-right">
      Приложение 50<br>
      к приказу Министра финансов<br>
      Республики Казахстан<br>
      от 20 декабря 2012 года № 562<br>
      <span class="form-code">Форма Р-1</span>
    </div>
  </div>

  <!-- Заказчик -->
  <div class="party-row">
    <span class="party-label">Заказчик</span>
    <div class="party-value-wrap">
      <span class="party-value">${customerLine}</span>
      <div class="sub-caption">полное наименование, адрес, данные о средствах связи</div>
    </div>
    <span class="party-bin">
      <span class="party-bin-label">ИИН/БИН</span>
      <span class="party-bin-box">${escapeHtml(data.customerBinIin ?? "")}</span>
    </span>
  </div>

  <!-- Исполнитель -->
  <div class="party-row">
    <span class="party-label">Исполнитель</span>
    <div class="party-value-wrap">
      <span class="party-value">${executorLine}</span>
      <div class="sub-caption">полное наименование, адрес, данные о средствах связи</div>
    </div>
    <span class="party-bin">
      <span class="party-bin-label">ИИН/БИН</span>
      <span class="party-bin-box">${escapeHtml(data.binIin)}</span>
    </span>
  </div>

  <!-- Договор + Заголовок АКТ + Номер/Дата -->
  <div class="contract-title-row">
    <span class="contract-part">
      <span>Договор (контракт)</span>
      <span class="contract-value">№ ${escapeHtml(data.contractNumber ?? "")} от ${escapeHtml(data.contractDate ?? "")}</span>
    </span>
    <span class="act-title">АКТ ВЫПОЛНЕННЫХ РАБОТ (ОКАЗАННЫХ УСЛУГ)</span>
    <div class="doc-number-box">
      <table>
        <tr>
          <td class="header-cell">Номер<br>документа</td>
          <td class="header-cell">Дата<br>составления</td>
          <td class="header-cell">Отчётный<br>период с</td>
          <td class="header-cell">по</td>
        </tr>
        <tr>
          <td class="value-cell">${escapeHtml(data.documentNumber)}</td>
          <td class="value-cell">${escapeHtml(data.documentDate)}</td>
          <td class="value-cell">${escapeHtml(data.periodFrom ?? "")}</td>
          <td class="value-cell">${escapeHtml(data.periodTo ?? "")}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- ТАБЛИЦА -->
  <table class="main">
    <thead>
      <tr>
        <th class="col-num" rowspan="2">Номер по порядку</th>
        <th class="col-name" rowspan="2">Наименование работ (услуг)</th>
        <th class="col-report" rowspan="2">Сведения о наличии отчета о маркетинговых исследованиях, консультационных и прочих услуг (дата, номер, количество страниц)</th>
        <th class="col-unit" rowspan="2">Единица измерения</th>
        <th colspan="3">Выполнено работ (оказано услуг)</th>
      </tr>
      <tr>
        <th class="col-qty">количество</th>
        <th class="col-price">цена за единицу</th>
        <th class="col-sum">стоимость</th>
      </tr>
      <tr>
        <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td></td>
        <td></td>
        <td></td>
        <td class="center">Итого</td>
        <td></td>
        <td class="center">х</td>
        <td class="right">${fmt(total)}</td>
      </tr>
    </tfoot>
  </table>

  <!-- Сведения о запасах -->
  <div class="reserves-row">
    <span>Сведения об использовании запасов, полученных от заказчика</span>
    <span class="reserves-value">${escapeHtml(data.reservesInfo ?? "")}</span>
  </div>
  <div class="reserves-caption">наименование, количество, стоимость</div>
  <div class="attachment-text">
    Приложение: Перечень документации, в том числе отчет(ы) о маркетинговых, научных исследованиях,
    консультационных и прочих услугах (обязательны при его (их) наличии) — ${escapeHtml(data.attachmentNote ?? "")}
  </div>

  <!-- ПОДПИСИ -->
  <div class="signatures">
    <div class="sig-half">
      <div class="sig-line">
        <span>Сдал (Исполнитель)</span>
        <span class="sig-underline">${escapeHtml(data.executorPosition ?? "")}</span>
        <span>/</span>
        <span class="sig-underline sig-underline-signature">
          <span class="signature-overlay">${signatureImg}</span>
          <span class="stamp-overlay">${stampImg}</span>
        </span>
        <span>/</span>
        <span class="sig-underline">${escapeHtml(data.executorSignatureName ?? "")}</span>
      </div>
      <div class="sig-caption">должность &nbsp;&nbsp; подпись &nbsp;&nbsp; расшифровка подписи</div>
      <div class="stamp-sig-row">
        <span class="mp-label">М.П.</span>
      </div>
    </div>

    <div class="sig-half">
      <div class="sig-line">
        <span>Принял (Заказчик)</span>
        <span class="sig-underline">${escapeHtml(data.customerPosition ?? "Директор")}</span>
        <span>/</span>
        <span class="sig-underline"></span>
        <span>/</span>
        <span class="sig-underline">${escapeHtml(data.customerSignatureName ?? "")}</span>
      </div>
      <div class="sig-caption">должность &nbsp;&nbsp; подпись &nbsp;&nbsp; расшифровка подписи</div>
      <div class="date-line">М.П.</div>
    </div>
  </div>

</div>
</body>
</html>`;
}
