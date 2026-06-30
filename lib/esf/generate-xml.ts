import type { EsfData, EsfItem } from "./types";

export type { EsfData, EsfItem } from "./types";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function n(value: number): string {
  return value.toFixed(2);
}

function tag(name: string, value: string | number | boolean): string {
  if (typeof value === "boolean") return `<esf:${name}>${value ? "1" : "0"}</esf:${name}>`;
  if (typeof value === "number") return `<esf:${name}>${n(value)}</esf:${name}>`;
  return `<esf:${name}>${escapeXml(value)}</esf:${name}>`;
}

function itemXml(item: EsfItem): string {
  return `
      <esf:Item>
        ${tag("OriginFlag", item.originFlag)}
        ${tag("Name", item.name)}
        ${tag("TnvedName", item.tnvedName)}
        ${tag("TnvedCode", item.tnvedCode)}
        ${tag("Unit", item.unit)}
        ${tag("Quantity", item.quantity)}
        ${tag("Price", item.price)}
        ${tag("Sum", item.sum)}
        ${tag("ExciseRate", item.exciseRate)}
        ${tag("ExciseSum", item.exciseSum)}
        ${tag("TurnoverInfo", item.turnoverInfo)}
        ${tag("VatRate", item.vatRate)}
        ${tag("VatSum", item.vatSum)}
        ${tag("SumWithTax", item.sumWithTax)}
        ${tag("DeclarationNumber", item.declarationNumber)}
        ${tag("TradePositionNumber", item.tradePositionNumber)}
        ${tag("SupplierEsfRegistrationNumber", item.supplierEsfRegistrationNumber)}
        ${tag("AdditionalData", item.additionalData)}
      </esf:Item>`;
}

/**
 * Генерирует XML ЭСФ по структуре официальной печатной формы (Разделы A–L,
 * Приложение 2 к Правилам документооборота счетов-фактур, выписываемых в
 * электронном виде). ВАЖНО: названия тегов подобраны по смыслу поля — реальной
 * XSD-схемы ИС ЭСФ нам не предоставили, есть только PDF печатной формы.
 * Перед боевой отправкой нужно сверить теги с настоящей схемой/WSDL ИС ЭСФ.
 */
export function generateEsfXml(data: EsfData): string {
  const { sectionA: a, sectionB: b, sectionB1: b1, sectionC: c, sectionC1: c1, sectionD: d, sectionE: e, sectionF: f } = data;

  const sectionAXml = `
    <esf:SectionA>
      ${tag("RegistrationNumber", a.registrationNumber)}
      ${tag("AccountingSystemNumber", a.accountingSystemNumber)}
      ${tag("IssueDate", a.issueDate)}
      ${tag("PaperIssueDate", a.paperIssueDate)}
      ${tag("TurnoverDate", a.turnoverDate)}
      ${tag("IsCorrected", a.isCorrected)}
      ${tag("CorrectedDate", a.correctedDate)}
      ${tag("CorrectedSystemNumber", a.correctedSystemNumber)}
      ${tag("CorrectedRegistrationNumber", a.correctedRegistrationNumber)}
      ${tag("IsAdditional", a.isAdditional)}
      ${tag("AdditionalDate", a.additionalDate)}
      ${tag("AdditionalSystemNumber", a.additionalSystemNumber)}
      ${tag("AdditionalRegistrationNumber", a.additionalRegistrationNumber)}
    </esf:SectionA>`;

  const sectionBXml = `
    <esf:SectionB>
      ${tag("Tin", b.binIin)}
      ${tag("StructuralUnitBin", b.structuralUnitBin)}
      ${tag("ReorganizedBin", b.reorganizedBin)}
      ${tag("Name", b.name)}
      ${tag("ParticipationShare", b.participationShare)}
      ${tag("Address", b.address)}
      ${tag("VatCertificateSeries", b.vatCertificateSeries)}
      ${tag("VatCertificateNumber", b.vatCertificateNumber)}
      ${tag("IsNonResidentStructuralUnit", b.isNonResidentStructuralUnit)}
      ${tag("Category", b.category)}
      ${tag("ParticipantsCount", b.participantsCount)}
      ${tag("AdditionalInfo", b.additionalInfo)}
    </esf:SectionB>`;

  const sectionB1Xml = `
    <esf:SectionB1>
      ${tag("Kbe", b1.kbe)}
      ${tag("Iik", b1.iik)}
      ${tag("Bik", b1.bik)}
      ${tag("BankName", b1.bankName)}
    </esf:SectionB1>`;

  const sectionCXml = `
    <esf:SectionC>
      ${tag("Tin", c.binIin)}
      ${tag("StructuralUnitBin", c.structuralUnitBin)}
      ${tag("ReorganizedBin", c.reorganizedBin)}
      ${tag("Name", c.name)}
      ${tag("ParticipationShare", c.participationShare)}
      ${tag("Address", c.address)}
      ${tag("CountryCode", c.countryCode)}
      ${tag("AdditionalInfo", c.additionalInfo)}
      ${tag("Category", c.category)}
      ${tag("ParticipantsCount", c.participantsCount)}
    </esf:SectionC>`;

  const sectionC1Xml = c1
    ? `
    <esf:SectionC1>
      ${tag("Iik", c1.iik)}
      ${tag("ProductCode", c1.productCode)}
      ${tag("PaymentPurpose", c1.paymentPurpose)}
      ${tag("Bik", c1.bik)}
    </esf:SectionC1>`
    : "";

  const sectionDXml = `
    <esf:SectionD>
      ${tag("ShipperBinIin", d.shipperBinIin)}
      ${tag("ShipperName", d.shipperName)}
      ${tag("ShipperAddress", d.shipperAddress)}
      ${tag("ConsigneeBinIin", d.consigneeBinIin)}
      ${tag("ConsigneeName", d.consigneeName)}
      ${tag("ConsigneeAddress", d.consigneeAddress)}
      ${tag("ConsigneeCountryCode", d.consigneeCountryCode)}
    </esf:SectionD>`;

  const sectionEXml = `
    <esf:SectionE>
      ${tag("HasContract", e.hasContract)}
      ${tag("NoContract", e.noContract)}
      ${tag("ContractNumber", e.contractNumber)}
      ${tag("ContractDate", e.contractDate)}
      ${tag("ContractAccountingNumber", e.contractAccountingNumber)}
      ${tag("PaymentTerms", e.paymentTerms)}
      ${tag("DispatchMethod", e.dispatchMethod)}
      ${tag("PoaNumber", e.poaNumber)}
      ${tag("PoaDate", e.poaDate)}
      ${tag("Destination", e.destination)}
      ${tag("DeliveryTerms", e.deliveryTerms)}
    </esf:SectionE>`;

  const sectionFXml = `
    <esf:SectionF>
      ${tag("DocumentNumber", f.documentNumber)}
      ${tag("DocumentDate", f.documentDate)}
      ${tag("CurrencyCode", f.currencyCode)}
      ${tag("CurrencyRate", f.currencyRate)}
    </esf:SectionF>`;

  const sectionGXml = `
    <esf:SectionG>${data.items.map(itemXml).join("")}
    </esf:SectionG>`;

  const sectionHXml =
    data.jointVentureItems.length > 0
      ? `
    <esf:SectionH>${data.jointVentureItems.map(itemXml).join("")}
    </esf:SectionH>`
      : "";

  const agentXml = (name: string, agent: EsfData["supplierAgent"]) =>
    agent
      ? `
    <esf:${name}>
      ${tag("Bin", agent.bin)}
      ${tag("Name", agent.name)}
      ${tag("Address", agent.address)}
      ${tag("DocumentNumber", agent.documentNumber)}
      ${tag("DocumentDate", agent.documentDate)}
    </esf:${name}>`
      : "";

  const sectionKXml = data.additionalInfo
    ? `
    <esf:SectionK>
      ${tag("AdditionalInfo", data.additionalInfo)}
    </esf:SectionK>`
    : "";

  const sectionLXml = `
    <esf:SectionL>
      ${tag("IssuedByFullName", data.issuedByFullName)}
    </esf:SectionL>`;

  const totalsXml = `
    <esf:Totals>
      ${tag("TotalSum", data.totalSum)}
      ${tag("TotalExcise", data.totalExcise)}
      ${tag("TotalVat", data.totalVat)}
      ${tag("TotalSumWithTax", data.totalSumWithTax)}
    </esf:Totals>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<esf:Documents xmlns:esf="http://esf.kgd.gov.kz">
  <esf:Document>${sectionAXml}${sectionBXml}${sectionB1Xml}${sectionCXml}${sectionC1Xml}${sectionDXml}${sectionEXml}${sectionFXml}${sectionGXml}${sectionHXml}${agentXml("SectionI", data.supplierAgent)}${agentXml("SectionJ", data.buyerAgent)}${sectionKXml}${sectionLXml}${totalsXml}
  </esf:Document>
</esf:Documents>`;
}
