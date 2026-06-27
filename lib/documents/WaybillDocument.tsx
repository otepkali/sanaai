import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { PDF_FONT_FAMILY } from "@/lib/pdf-fonts";
import { numberToWordsKZT } from "@/lib/invoice/calc";
import { BORDER, SignatureSlot, StampOverlay } from "./pdf-elements";
import { formatDecimal } from "@/lib/format";
import type { WaybillData, CompanyRequisites } from "./types";

const styles = StyleSheet.create({
  page: {
    padding: "14mm 12mm",
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 8.5,
    color: "#000000",
  },
  headerBlock: {
    alignSelf: "flex-end",
    width: 260,
    textAlign: "right",
    marginBottom: 4,
  },
  formCode: {
    alignSelf: "flex-end",
    fontWeight: "bold",
    marginBottom: 10,
  },
  orgRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  orgValue: {
    flex: 1,
    borderBottom: BORDER,
    marginHorizontal: 6,
  },
  binValue: {
    border: BORDER,
    minWidth: 130,
    padding: 3,
    marginLeft: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    flex: 1,
  },
  docNumberBox: { flexDirection: "row" },
  docNumberCell: {
    border: BORDER,
    width: 80,
    textAlign: "center",
  },
  docNumberHeader: { fontSize: 7, padding: 3, borderBottom: BORDER },
  docNumberValue: { padding: 6, minHeight: 16 },
  partiesTable: {
    borderTop: BORDER,
    borderLeft: BORDER,
    marginBottom: 14,
  },
  partiesRow: { flexDirection: "row" },
  partiesHeaderCell: {
    flex: 1,
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 3,
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
  },
  partiesValueCell: {
    flex: 1,
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 4,
    minHeight: 24,
  },
  table: {
    borderTop: BORDER,
    borderLeft: BORDER,
    marginBottom: 10,
  },
  row: { flexDirection: "row" },
  headerCell: {
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 3,
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
  },
  cell: {
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 3,
    fontSize: 7.5,
  },
  colNum: { flex: 0.5, textAlign: "center" },
  colName: { flex: 2.4 },
  colNomen: { flex: 1.2, textAlign: "center" },
  colUnit: { flex: 0.9, textAlign: "center" },
  colQtyToRelease: { flex: 1, textAlign: "right" },
  colQtyReleased: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1.1, textAlign: "right" },
  colSumVat: { flex: 1.2, textAlign: "right" },
  colVat: { flex: 1.1, textAlign: "right" },
  qtyGroupHeader: {
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 2,
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    flex: 2,
  },
  totalsLine: { marginBottom: 2 },
  signatureGrid: {
    flexDirection: "row",
    marginTop: 16,
    gap: 24,
  },
  signatureHalf: { flex: 1 },
  signatureFieldRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 8,
  },
  caption: {
    fontSize: 7,
    // italic недоступен — Arimo не зарегистрирован для этого стиля
    color: "#444444",
  },
  stampLine: {
    position: "relative",
    marginTop: 10,
  },
});

function formatNumber(value: number): string {
  return formatDecimal(value, 2);
}

export function WaybillDocument({
  data,
  requisites,
  signature,
  stamp,
}: {
  data: WaybillData;
  requisites: CompanyRequisites;
  signature: Buffer | null;
  stamp: Buffer | null;
}) {
  const totalSumWithVat = data.items.reduce((sum, item) => sum + item.sumWithVat, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.headerBlock}>
          Приложение 26{"\n"}к приказу Министра финансов{"\n"}Республики Казахстан{"\n"}от 20.12.2012
          года № 562
        </Text>
        <Text style={styles.formCode}>Форма З-2</Text>

        <View style={styles.orgRow}>
          <Text>Организация (индивидуальный предприниматель)</Text>
          <Text style={styles.orgValue}>{requisites.companyName || ""}</Text>
          <Text>ИИН/БИН</Text>
          <Text style={styles.binValue}>{requisites.binIin || ""}</Text>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title}>НАКЛАДНАЯ НА ОТПУСК ЗАПАСОВ НА СТОРОНУ</Text>
          <View style={styles.docNumberBox}>
            <View style={styles.docNumberCell}>
              <Text style={styles.docNumberHeader}>Номер документа</Text>
              <Text style={styles.docNumberValue}>{data.documentNumber || ""}</Text>
            </View>
            <View style={styles.docNumberCell}>
              <Text style={styles.docNumberHeader}>Дата составления</Text>
              <Text style={styles.docNumberValue}>{data.documentDate || ""}</Text>
            </View>
          </View>
        </View>

        <View style={styles.partiesTable}>
          <View style={styles.partiesRow}>
            <Text style={styles.partiesHeaderCell}>
              Организация (индивидуальный предприниматель) — отправитель
            </Text>
            <Text style={styles.partiesHeaderCell}>
              Организация (индивидуальный предприниматель) — получатель
            </Text>
            <Text style={styles.partiesHeaderCell}>Ответственный за поставку (Ф.И.О.)</Text>
            <Text style={styles.partiesHeaderCell}>Транспортная организация</Text>
            <Text style={[styles.partiesHeaderCell, { borderRight: "none" }]}>
              Товарно-транспортная накладная (номер, дата)
            </Text>
          </View>
          <View style={styles.partiesRow}>
            <Text style={styles.partiesValueCell}>{data.senderName || requisites.companyName || ""}</Text>
            <Text style={styles.partiesValueCell}>{data.recipientName || ""}</Text>
            <Text style={styles.partiesValueCell}>{data.responsiblePerson || ""}</Text>
            <Text style={styles.partiesValueCell}>{data.transportOrganization || ""}</Text>
            <Text style={[styles.partiesValueCell, { borderRight: "none" }]}>
              {data.transportDocument || ""}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.headerCell, styles.colNum]}>Номер по порядку</Text>
            <Text style={[styles.headerCell, styles.colName]}>Наименование, характеристика</Text>
            <Text style={[styles.headerCell, styles.colNomen]}>Номенклатурный номер</Text>
            <Text style={[styles.headerCell, styles.colUnit]}>Единица измерения</Text>
            <Text style={styles.qtyGroupHeader}>Количество</Text>
            <Text style={[styles.headerCell, styles.colPrice]}>Цена за единицу, в тенге</Text>
            <Text style={[styles.headerCell, styles.colSumVat]}>Сумма с НДС, в тенге</Text>
            <Text style={[styles.headerCell, styles.colVat, { borderRight: "none" }]}>
              Сумма НДС, в тенге
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.headerCell, styles.colNum]} />
            <Text style={[styles.headerCell, styles.colName]} />
            <Text style={[styles.headerCell, styles.colNomen]} />
            <Text style={[styles.headerCell, styles.colUnit]} />
            <Text style={[styles.headerCell, styles.colQtyToRelease]}>подлежит отпуску</Text>
            <Text style={[styles.headerCell, styles.colQtyReleased]}>отпущено</Text>
            <Text style={[styles.headerCell, styles.colPrice]} />
            <Text style={[styles.headerCell, styles.colSumVat]} />
            <Text style={[styles.headerCell, styles.colVat, { borderRight: "none" }]} />
          </View>
          <View style={styles.row}>
            <Text style={[styles.headerCell, styles.colNum]}>1</Text>
            <Text style={[styles.headerCell, styles.colName]}>2</Text>
            <Text style={[styles.headerCell, styles.colNomen]}>3</Text>
            <Text style={[styles.headerCell, styles.colUnit]}>4</Text>
            <Text style={[styles.headerCell, styles.colQtyToRelease]}>5</Text>
            <Text style={[styles.headerCell, styles.colQtyReleased]}>6</Text>
            <Text style={[styles.headerCell, styles.colPrice]}>7</Text>
            <Text style={[styles.headerCell, styles.colSumVat]}>8</Text>
            <Text style={[styles.headerCell, styles.colVat, { borderRight: "none" }]}>9</Text>
          </View>
          {data.items.map((item, index) => (
            <View style={styles.row} key={index}>
              <Text style={[styles.cell, styles.colNum]}>{index + 1}</Text>
              <Text style={[styles.cell, styles.colName]}>{item.name || ""}</Text>
              <Text style={[styles.cell, styles.colNomen]}>{item.nomenclatureNumber || ""}</Text>
              <Text style={[styles.cell, styles.colUnit]}>{item.unit || ""}</Text>
              <Text style={[styles.cell, styles.colQtyToRelease]}>{formatNumber(item.quantityToRelease)}</Text>
              <Text style={[styles.cell, styles.colQtyReleased]}>{formatNumber(item.quantityReleased)}</Text>
              <Text style={[styles.cell, styles.colPrice]}>{formatNumber(item.price)}</Text>
              <Text style={[styles.cell, styles.colSumVat]}>{formatNumber(item.sumWithVat)}</Text>
              <Text style={[styles.cell, styles.colVat, { borderRight: "none" }]}>
                {formatNumber(item.vatSum)}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.totalsLine}>
          Всего отпущено количество запасов (прописью) ___________________ на сумму (прописью), в тенге{" "}
          {numberToWordsKZT(totalSumWithVat)}
        </Text>

        <View style={styles.signatureGrid}>
          <View style={styles.signatureHalf}>
            <View style={styles.signatureFieldRow}>
              <Text>Отпуск разрешил</Text>
              <SignatureSlot signature={null} />
            </View>
            <Text style={styles.caption}>должность · подпись · расшифровка подписи</Text>

            <View style={styles.signatureFieldRow}>
              <Text>Главный бухгалтер</Text>
              <SignatureSlot signature={signature} />
            </View>
            <Text style={styles.caption}>/{requisites.accountantName || "—"}/</Text>
            <View style={styles.stampLine}>
              <Text>М.П.</Text>
              <StampOverlay stamp={stamp} />
            </View>

            <View style={styles.signatureFieldRow}>
              <Text>Отпустил</Text>
              <SignatureSlot signature={null} />
            </View>
          </View>

          <View style={styles.signatureHalf}>
            <Text>По доверенности № {data.poaNumber || "—"} от «{data.poaDate || "___"}» года</Text>
            <Text style={{ marginTop: 4 }}>выданной {data.poaIssuedTo || ""}</Text>

            <View style={[styles.signatureFieldRow, { marginTop: 28 }]}>
              <Text>Запасы получил</Text>
              <SignatureSlot signature={null} />
            </View>
            <Text style={styles.caption}>подпись · расшифровка подписи</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
