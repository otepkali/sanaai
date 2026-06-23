import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { formatDateLong } from "@/lib/format";
import { PDF_FONT_FAMILY } from "@/lib/pdf-fonts";
import { calculateInvoiceTotals, formatMoney } from "./calc";
import type { InvoiceData } from "./types";

const BORDER = "1pt solid #000000";

const styles = StyleSheet.create({
  page: {
    padding: "16mm 14mm",
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 9.5,
    color: "#000000",
  },
  disclaimer: {
    fontSize: 8,
    textAlign: "center",
    marginHorizontal: 50,
    marginBottom: 14,
    lineHeight: 1.3,
  },
  sectionLabel: {
    fontSize: 9.5,
    fontWeight: "bold",
    marginBottom: 3,
  },
  paymentTable: {
    borderTop: BORDER,
    borderLeft: BORDER,
    marginBottom: 16,
  },
  paymentRow: {
    flexDirection: "row",
  },
  paymentCellWide: {
    flex: 2,
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 4,
  },
  paymentCellNarrow: {
    flex: 1,
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 4,
    textAlign: "center",
  },
  cellCaption: {
    fontWeight: "bold",
    marginBottom: 2,
  },
  cellValueBold: {
    fontWeight: "bold",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
  },
  partyRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  partyLabel: {
    width: 64,
  },
  partyValue: {
    flex: 1,
    fontWeight: "bold",
  },
  itemsTable: {
    borderTop: BORDER,
    borderLeft: BORDER,
    marginTop: 8,
  },
  itemsHeaderRow: {
    flexDirection: "row",
  },
  itemsRow: {
    flexDirection: "row",
  },
  itemsHeaderCell: {
    borderRight: BORDER,
    borderBottom: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 3,
    fontSize: 8.5,
    fontWeight: "bold",
    textAlign: "center",
  },
  itemsCell: {
    borderRight: BORDER,
    borderBottom: BORDER,
    paddingVertical: 2,
    paddingHorizontal: 3,
    fontSize: 8.5,
  },
  colNum: { flex: 0.5, textAlign: "center" },
  colCode: { flex: 1.3 },
  colName: { flex: 4 },
  colQty: { flex: 1, textAlign: "right" },
  colUnit: { flex: 0.8, textAlign: "center" },
  colPrice: { flex: 1.4, textAlign: "right" },
  colSum: { flex: 1.5, textAlign: "right" },
  totalsBlock: {
    marginTop: 6,
    alignItems: "flex-end",
  },
  totalsRow: {
    flexDirection: "row",
    width: 220,
    justifyContent: "space-between",
    fontWeight: "bold",
    marginBottom: 2,
  },
  summaryLine: {
    marginTop: 10,
  },
  amountInWords: {
    marginTop: 2,
    fontWeight: "bold",
  },
  taxSection: {
    marginTop: 26,
    paddingTop: 10,
    borderTop: "1pt solid #999999",
  },
  taxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  taxFootnote: {
    marginTop: 6,
    fontSize: 8,
    color: "#555555",
    lineHeight: 1.3,
  },
  signatureRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 40,
  },
  signatureLine: {
    flex: 1,
    borderBottom: "1pt solid #000000",
    marginHorizontal: 6,
    marginBottom: 1,
  },
});

const DISCLAIMER_TEXT =
  "Внимание! Оплата данного счета означает согласие с условиями поставки товара. Уведомление об оплате обязательно, в противном случае не гарантируется наличие товара на складе. Товар отпускается по факту прихода денег на р/с Поставщика, самовывозом, при наличии доверенности и документов удостоверяющих личность.";

function PartyLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.partyRow}>
      <Text style={styles.partyLabel}>{label}</Text>
      <Text style={styles.partyValue}>{value}</Text>
    </View>
  );
}

function formatPartyValue(party: { binIin: string; name: string; address?: string }): string {
  const parts = [`БИН/ИИН ${party.binIin || "—"}`, party.name || "—"];
  if (party.address) parts.push(party.address);
  return parts.join(", ");
}

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  const result = calculateInvoiceTotals(data);
  const { beneficiary } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.disclaimer}>{DISCLAIMER_TEXT}</Text>

        <Text style={styles.sectionLabel}>Образец платежного поручения</Text>
        <View style={styles.paymentTable}>
          <View style={styles.paymentRow}>
            <View style={styles.paymentCellWide}>
              <Text style={styles.cellCaption}>Бенефициар:</Text>
              <Text style={styles.cellValueBold}>{beneficiary.name || "—"}</Text>
              <Text>ИИН: {beneficiary.iin || "—"}</Text>
            </View>
            <View style={styles.paymentCellNarrow}>
              <Text style={styles.cellCaption}>ИИК</Text>
              <Text style={styles.cellValueBold}>{beneficiary.iik || "—"}</Text>
            </View>
            <View style={[styles.paymentCellNarrow, { borderRight: BORDER }]}>
              <Text style={styles.cellCaption}>Кбе</Text>
              <Text style={styles.cellValueBold}>{beneficiary.kbe || "—"}</Text>
            </View>
          </View>
          <View style={styles.paymentRow}>
            <View style={styles.paymentCellWide}>
              <Text style={styles.cellCaption}>Банк бенефициара:</Text>
              <Text>{beneficiary.bankName || "—"}</Text>
            </View>
            <View style={styles.paymentCellNarrow}>
              <Text style={styles.cellCaption}>БИК</Text>
              <Text style={styles.cellValueBold}>{beneficiary.bik || "—"}</Text>
            </View>
            <View style={[styles.paymentCellNarrow, { borderRight: BORDER }]}>
              <Text style={styles.cellCaption}>Код назначения платежа</Text>
              <Text style={styles.cellValueBold}>{beneficiary.knp || "—"}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.title}>
          Счёт на оплату № {data.number || "—"} от {formatDateLong(data.date)}
        </Text>

        <PartyLine label="Поставщик:" value={formatPartyValue(data.supplier)} />
        <PartyLine label="Покупатель:" value={formatPartyValue(data.buyer)} />
        <PartyLine label="Договор:" value={data.contract || "Без договора"} />

        <View style={styles.itemsTable}>
          <View style={styles.itemsHeaderRow}>
            <Text style={[styles.itemsHeaderCell, styles.colNum]}>№</Text>
            <Text style={[styles.itemsHeaderCell, styles.colCode]}>Код</Text>
            <Text style={[styles.itemsHeaderCell, styles.colName]}>Наименование</Text>
            <Text style={[styles.itemsHeaderCell, styles.colQty]}>Кол-во</Text>
            <Text style={[styles.itemsHeaderCell, styles.colUnit]}>Ед.</Text>
            <Text style={[styles.itemsHeaderCell, styles.colPrice]}>Цена</Text>
            <Text style={[styles.itemsHeaderCell, styles.colSum, { borderRight: "none" }]}>
              Сумма
            </Text>
          </View>
          {result.lines.map((line, index) => (
            <View style={styles.itemsRow} key={`${line.code}-${index}`}>
              <Text style={[styles.itemsCell, styles.colNum]}>{index + 1}</Text>
              <Text style={[styles.itemsCell, styles.colCode]}>{line.code || "—"}</Text>
              <Text style={[styles.itemsCell, styles.colName]}>{line.name || "—"}</Text>
              <Text style={[styles.itemsCell, styles.colQty]}>{formatMoney(line.qty)}</Text>
              <Text style={[styles.itemsCell, styles.colUnit]}>{line.unit}</Text>
              <Text style={[styles.itemsCell, styles.colPrice]}>{formatMoney(line.price)}</Text>
              <Text style={[styles.itemsCell, styles.colSum, { borderRight: "none" }]}>
                {formatMoney(line.lineTotal)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text>Итого:</Text>
            <Text>{formatMoney(result.subtotal)}</Text>
          </View>
          {result.vatAmount !== null ? (
            <View style={styles.totalsRow}>
              <Text>{result.vatMode === "exclusive" ? "Кроме того НДС:" : "В том числе НДС:"}</Text>
              <Text>{formatMoney(result.vatAmount)}</Text>
            </View>
          ) : null}
          {result.vatMode === "exclusive" && result.vatAmount !== null ? (
            <View style={styles.totalsRow}>
              <Text>Всего с НДС:</Text>
              <Text>{formatMoney(result.grossAmount)}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.summaryLine}>
          Всего наименований {result.itemsCount}, на сумму {formatMoney(result.grossAmount)} KZT
        </Text>
        <Text style={styles.amountInWords}>Всего к оплате: {result.amountInWords}</Text>

        {data.showTaxBlock ? (
          <View style={styles.taxSection}>
            <Text style={styles.sectionLabel}>Налоговый блок (справка-расчёт)</Text>
            {result.vatAmount !== null ? (
              <View style={styles.taxRow}>
                <Text>НДС (16%):</Text>
                <Text>{formatMoney(result.vatAmount)}</Text>
              </View>
            ) : null}
            <View style={styles.taxRow}>
              <Text>Налогооблагаемый доход (сумма без НДС − расходы):</Text>
              <Text>{formatMoney(result.taxableIncome)}</Text>
            </View>
            <View style={styles.taxRow}>
              <Text style={{ fontWeight: "bold" }}>ИПН (10% от прибыли):</Text>
              <Text style={{ fontWeight: "bold" }}>{formatMoney(result.ipnAmount ?? 0)}</Text>
            </View>
            <Text style={styles.taxFootnote}>
              Итоговый ИПН рассчитывается по итогам налогового периода на основе всех
              фактических вычетов. Расчёт выше — иллюстративная оценка по одной сделке.
            </Text>
          </View>
        ) : null}

        <View style={styles.signatureRow}>
          <Text>Исполнитель</Text>
          <View style={styles.signatureLine} />
          <Text>/Руководитель/</Text>
        </View>
      </Page>
    </Document>
  );
}
