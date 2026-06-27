import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { PDF_FONT_FAMILY_SERIF } from "@/lib/pdf-fonts";
import { BORDER, SignatureSlot, StampOverlay } from "./pdf-elements";
import { formatDecimal } from "@/lib/format";
import type { AvrData, CompanyRequisites } from "./types";

const styles = StyleSheet.create({
  page: {
    padding: "14mm 16mm",
    fontFamily: PDF_FONT_FAMILY_SERIF,
    fontSize: 10,
    color: "#000000",
  },
  headerBlock: {
    alignSelf: "flex-end",
    width: 260,
    textAlign: "right",
    fontStyle: "italic",
    fontSize: 9,
    marginBottom: 2,
  },
  formCode: {
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  partyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 1,
  },
  partyLabel: {
    fontWeight: "bold",
    width: 70,
  },
  partyValue: {
    flex: 1,
    fontWeight: "bold",
    textAlign: "center",
  },
  binBox: {
    width: 130,
    alignItems: "center",
    marginLeft: 10,
  },
  binBoxLabel: {
    fontSize: 9,
  },
  binBoxValue: {
    border: BORDER,
    width: "100%",
    textAlign: "center",
    padding: 3,
    marginTop: 2,
  },
  caption: {
    fontSize: 8,
    fontStyle: "italic",
    color: "#444444",
    textAlign: "center",
    marginLeft: 70,
    marginBottom: 8,
  },
  contractRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  contractLabel: {
    fontWeight: "bold",
  },
  contractLine: {
    flex: 1,
    borderBottom: BORDER,
    marginLeft: 6,
    marginRight: 10,
  },
  docInfoBox: {
    flexDirection: "row",
    borderTop: BORDER,
    borderLeft: BORDER,
  },
  docInfoCell: {
    width: 78,
    borderRight: BORDER,
  },
  docInfoCellWide: {
    width: 110,
    borderRight: BORDER,
  },
  docInfoHeader: {
    fontSize: 8,
    padding: 2,
    borderBottom: BORDER,
    textAlign: "center",
  },
  docInfoValue: {
    padding: 4,
    minHeight: 14,
    textAlign: "center",
    fontSize: 9,
  },
  periodSplit: {
    flexDirection: "row",
  },
  periodCell: {
    flex: 1,
    borderRight: BORDER,
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 10,
  },
  table: {
    borderTop: BORDER,
    borderLeft: BORDER,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
  },
  headerCell: {
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 2,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerCellMerged: {
    flexDirection: "column",
    justifyContent: "flex-start",
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 2,
  },
  headerCellMergedText: {
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerGroupWrap: {
    flexDirection: "column",
  },
  headerGroupLabel: {
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 2,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerGroupRow: {
    flexDirection: "row",
    flex: 1,
  },
  cell: {
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 3,
    fontSize: 9,
  },
  colNum: { flex: 0.5, textAlign: "center" },
  colName: { flex: 3 },
  colReport: { flex: 2.2 },
  colUnit: { flex: 0.9, textAlign: "center" },
  colQty: { flex: 0.8, textAlign: "right" },
  colPrice: { flex: 1.1, textAlign: "right" },
  colSum: { flex: 1.3, textAlign: "right" },
  colDone: { flex: 3.2 },
  belowTable: {
    marginTop: 8,
  },
  belowTableLine: {
    flexDirection: "row",
    marginBottom: 4,
  },
  belowTableValue: {
    flex: 1,
    borderBottom: BORDER,
    marginLeft: 4,
  },
  sigBlock: {
    flexDirection: "row",
    marginTop: 24,
    gap: 20,
  },
  sigHalf: {
    flex: 1,
  },
  sigRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  sigCaptionRow: {
    flexDirection: "row",
  },
  sigCaption: {
    flex: 1,
    fontSize: 8,
    fontStyle: "italic",
    color: "#444444",
    textAlign: "center",
  },
  stampRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },
});

function formatNumber(value: number): string {
  return formatDecimal(value, 2);
}

export function AvrDocument({
  data,
  requisites,
  signature,
  stamp,
}: {
  data: AvrData;
  requisites: CompanyRequisites;
  signature: Buffer | null;
  stamp: Buffer | null;
}) {
  const executorLine = [requisites.companyName, requisites.address].filter(Boolean).join(", ");

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.headerBlock}>
          {"Приложение 50\nк приказу Министра финансов\nРеспублики Казахстан\nот 20 декабря 2012 года № 562"}
        </Text>
        <Text style={styles.formCode}>Форма Р-1</Text>

        <View style={styles.partyRow}>
          <Text style={styles.partyLabel}>Заказчик</Text>
          <Text style={styles.partyValue}>{data.customerName || ""}</Text>
          <View style={styles.binBox}>
            <Text style={styles.binBoxLabel}>ИИН/БИН</Text>
            <Text style={styles.binBoxValue}>{data.customerBinIin || ""}</Text>
          </View>
        </View>
        <Text style={styles.caption}>полное наименование, адрес, данные о средствах связи</Text>

        <View style={styles.partyRow}>
          <Text style={styles.partyLabel}>Исполнитель</Text>
          <Text style={styles.partyValue}>{data.executorName || executorLine}</Text>
          <View style={styles.binBox}>
            <Text style={styles.binBoxLabel}>ИИН/БИН</Text>
            <Text style={styles.binBoxValue}>{requisites.binIin || ""}</Text>
          </View>
        </View>
        <Text style={styles.caption}>полное наименование, адрес, данные о средствах связи</Text>

        <View style={styles.contractRow}>
          <Text style={styles.contractLabel}>Договор (контракт)</Text>
          <Text style={styles.contractLine}>
            {data.contractNumber ? ` № ${data.contractNumber} от ${data.contractDate || ""}` : ""}
          </Text>
          <View style={styles.docInfoBox}>
            <View style={styles.docInfoCell}>
              <Text style={styles.docInfoHeader}>{"Номер\nдокумента"}</Text>
              <Text style={styles.docInfoValue}>{data.documentNumber || ""}</Text>
            </View>
            <View style={styles.docInfoCell}>
              <Text style={styles.docInfoHeader}>{"Дата\nсоставления"}</Text>
              <Text style={styles.docInfoValue}>{data.documentDate || ""}</Text>
            </View>
            <View style={styles.docInfoCellWide}>
              <Text style={styles.docInfoHeader}>Отчётный период</Text>
              <View style={styles.periodSplit}>
                <View style={styles.periodCell}>
                  <Text style={styles.docInfoHeader}>с</Text>
                  <Text style={styles.docInfoValue}>{data.periodFrom || ""}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docInfoHeader}>по</Text>
                  <Text style={styles.docInfoValue}>{data.periodTo || ""}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.title}>АКТ ВЫПОЛНЕННЫХ РАБОТ (ОКАЗАННЫХ УСЛУГ)</Text>

        <View style={styles.table}>
          <View style={styles.row}>
            <View style={[styles.headerCellMerged, styles.colNum]}>
              <Text style={styles.headerCellMergedText}>Номер по порядку</Text>
            </View>
            <View style={[styles.headerCellMerged, styles.colName]}>
              <Text style={styles.headerCellMergedText}>Наименование работ (услуг)</Text>
            </View>
            <View style={[styles.headerCellMerged, styles.colReport]}>
              <Text style={styles.headerCellMergedText}>
                Сведения о наличии отчёта о маркетинговых исследованиях, консультационных и прочих
                услуг (дата, номер, количество страниц)
              </Text>
            </View>
            <View style={[styles.headerCellMerged, styles.colUnit]}>
              <Text style={styles.headerCellMergedText}>Единица измерения</Text>
            </View>
            <View style={[styles.headerGroupWrap, styles.colDone]}>
              <Text style={styles.headerGroupLabel}>Выполнено работ (оказано услуг)</Text>
              <View style={styles.headerGroupRow}>
                <Text style={[styles.headerCell, styles.colQty]}>количество</Text>
                <Text style={[styles.headerCell, styles.colPrice]}>цена за единицу</Text>
                <Text style={[styles.headerCell, styles.colSum]}>стоимость</Text>
              </View>
            </View>
          </View>
          <View style={styles.row}>
            <Text style={[styles.headerCell, styles.colNum]}>1</Text>
            <Text style={[styles.headerCell, styles.colName]}>2</Text>
            <Text style={[styles.headerCell, styles.colReport]}>3</Text>
            <Text style={[styles.headerCell, styles.colUnit]}>4</Text>
            <Text style={[styles.headerCell, styles.colQty]}>5</Text>
            <Text style={[styles.headerCell, styles.colPrice]}>6</Text>
            <Text style={[styles.headerCell, styles.colSum]}>7</Text>
          </View>
          {data.items.map((item, index) => (
            <View style={styles.row} key={index}>
              <Text style={[styles.cell, styles.colNum]}>{index + 1}</Text>
              <Text style={[styles.cell, styles.colName]}>{item.name || ""}</Text>
              <Text style={[styles.cell, styles.colReport]}>{item.reportInfo || ""}</Text>
              <Text style={[styles.cell, styles.colUnit]}>{item.unit || ""}</Text>
              <Text style={[styles.cell, styles.colQty]}>{formatNumber(item.quantity)}</Text>
              <Text style={[styles.cell, styles.colPrice]}>{formatNumber(item.price)}</Text>
              <Text style={[styles.cell, styles.colSum]}>{formatNumber(item.quantity * item.price)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.belowTable}>
          <View style={styles.belowTableLine}>
            <Text>Сведения об использовании запасов, полученных от заказчика</Text>
            <Text style={styles.belowTableValue}>{data.reservesInfo || ""}</Text>
          </View>
          <View style={styles.belowTableLine}>
            <Text>Приложение: Перечень документации</Text>
            <Text style={styles.belowTableValue}>{data.attachmentPages || ""}</Text>
          </View>
        </View>

        <View style={styles.sigBlock}>
          <View style={styles.sigHalf}>
            <View style={styles.sigRow}>
              <Text>Сдал (Исполнитель) </Text>
              <SignatureSlot signature={null} />
              <Text> / </Text>
              <SignatureSlot signature={signature} />
              <Text> / </Text>
              <SignatureSlot signature={null} />
            </View>
            <View style={styles.sigCaptionRow}>
              <Text style={styles.sigCaption}>должность</Text>
              <Text style={styles.sigCaption}>подпись</Text>
              <Text style={styles.sigCaption}>расшифровка подписи</Text>
            </View>
            <View style={styles.stampRow}>
              <Text>М.П.</Text>
              <StampOverlay stamp={stamp} />
            </View>
          </View>

          <View style={styles.sigHalf}>
            <View style={styles.sigRow}>
              <Text>Принял (Заказчик) </Text>
              <SignatureSlot signature={null} />
              <Text> / </Text>
              <SignatureSlot signature={null} />
              <Text> / </Text>
              <SignatureSlot signature={null} />
            </View>
            <View style={styles.sigCaptionRow}>
              <Text style={styles.sigCaption}>должность</Text>
              <Text style={styles.sigCaption}>подпись</Text>
              <Text style={styles.sigCaption}>расшифровка подписи</Text>
            </View>
            <View style={styles.stampRow}>
              <Text>М.П.</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
