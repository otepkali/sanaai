import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { PDF_FONT_FAMILY_SERIF } from "@/lib/pdf-fonts";
import { BORDER, SignatureSlot, StampOverlay } from "./pdf-elements";
import { formatDecimal } from "@/lib/format";
import type { AvrData, CompanyRequisites } from "./types";

const styles = StyleSheet.create({
  page: {
    padding: "14mm 16mm",
    fontFamily: PDF_FONT_FAMILY_SERIF,
    fontSize: 11,
    color: "#000000",
  },
  headerBlock: {
    alignSelf: "flex-end",
    width: 300,
    textAlign: "right",
    marginBottom: 4,
  },
  formCode: {
    alignSelf: "flex-end",
    fontWeight: "bold",
    marginBottom: 10,
  },
  binBox: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  binBoxValue: {
    border: BORDER,
    minWidth: 160,
    padding: 3,
  },
  partyLine: {
    flexDirection: "row",
    marginBottom: 2,
  },
  partyLabel: {
    fontWeight: "bold",
  },
  partyValue: {
    flex: 1,
    borderBottom: BORDER,
    marginLeft: 4,
  },
  caption: {
    fontSize: 9,
    // italic недоступен — Tinos зарегистрирован только Regular/Bold
    color: "#444444",
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  docNumberBox: {
    flexDirection: "row",
  },
  docNumberCell: {
    border: BORDER,
    width: 90,
    textAlign: "center",
  },
  docNumberHeader: {
    fontSize: 9,
    padding: 3,
    borderBottom: BORDER,
  },
  docNumberValue: {
    padding: 6,
    minHeight: 16,
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
    padding: 3,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
  },
  cell: {
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 3,
    fontSize: 10,
  },
  colNum: { flex: 0.5, textAlign: "center" },
  colName: { flex: 3 },
  colDate: { flex: 1.2, textAlign: "center" },
  colReport: { flex: 1.8 },
  colUnit: { flex: 1, textAlign: "center" },
  colQty: { flex: 0.9, textAlign: "right" },
  colPrice: { flex: 1.1, textAlign: "right" },
  colSum: { flex: 1.2, textAlign: "right" },
  belowTable: {
    marginTop: 10,
  },
  belowTableLine: {
    flexDirection: "row",
    marginBottom: 2,
  },
  belowTableLabel: {},
  belowTableValue: {
    flex: 1,
    borderBottom: BORDER,
    marginLeft: 4,
  },
  signatureBlock: {
    flexDirection: "row",
    marginTop: 30,
    gap: 20,
  },
  signaturePartyHalf: {
    flex: 1,
  },
  signatureCaption: {
    fontSize: 9,
    // italic недоступен — Tinos зарегистрирован только Regular/Bold
    color: "#444444",
    marginTop: 2,
  },
  signatureFieldRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 8,
  },
  stampRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 28,
  },
  footnote: {
    marginTop: 18,
    fontSize: 9,
    color: "#444444",
    lineHeight: 1.3,
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
  const total = data.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const executorLine = `${requisites.companyName || "—"}, БИН/ИИН ${requisites.binIin || "—"}, ${requisites.address || "—"}`;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View>
          <Text style={styles.headerBlock}>
            Приложение 50{"\n"}к приказу Министра финансов{"\n"}Республики Казахстан{"\n"}от 20 декабря
            2012 года № 562
          </Text>
          <Text style={styles.formCode}>форма Р-1</Text>
          <View style={styles.binBox}>
            <Text>ИИН/БИН</Text>
            <Text style={styles.binBoxValue}>{requisites.binIin || ""}</Text>
          </View>
        </View>

        <View style={styles.partyLine}>
          <Text style={styles.partyLabel}>Заказчик</Text>
          <Text style={styles.partyValue}>{data.customerName || ""}</Text>
        </View>
        <Text style={styles.caption}>полное наименование, адрес, данные о средствах связи</Text>

        <View style={styles.partyLine}>
          <Text style={styles.partyLabel}>Исполнитель</Text>
          <Text style={styles.partyValue}>{data.executorName || executorLine}</Text>
        </View>
        <Text style={styles.caption}>полное наименование, адрес, данные о средствах связи</Text>

        <View style={styles.partyLine}>
          <Text style={styles.partyLabel}>Договор (контракт)</Text>
          <Text>
            {" "}№ {data.contractNumber || "—"} от «{data.contractDate || "___"}» г.
          </Text>
        </View>

        <View style={styles.titleRow}>
          <Text style={[styles.title, { flex: 1, textAlign: "left" }]}>
            АКТ ВЫПОЛНЕННЫХ РАБОТ (ОКАЗАННЫХ УСЛУГ)*
          </Text>
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

        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.headerCell, styles.colNum]}>Номер по порядку</Text>
            <Text style={[styles.headerCell, styles.colName]}>Наименование работ (услуг)</Text>
            <Text style={[styles.headerCell, styles.colDate]}>Дата выполнения работ (оказания услуг)</Text>
            <Text style={[styles.headerCell, styles.colReport]}>
              Сведения об отчёте о научных исследованиях, маркетинговых, консультационных и прочих
              услугах
            </Text>
            <Text style={[styles.headerCell, styles.colUnit]}>Единица измерения</Text>
            <Text style={[styles.headerCell, styles.colQty]}>Количество</Text>
            <Text style={[styles.headerCell, styles.colPrice]}>Цена за единицу</Text>
            <Text style={[styles.headerCell, styles.colSum, { borderRight: "none" }]}>Стоимость</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.headerCell, styles.colNum]}>1</Text>
            <Text style={[styles.headerCell, styles.colName]}>2</Text>
            <Text style={[styles.headerCell, styles.colDate]}>3</Text>
            <Text style={[styles.headerCell, styles.colReport]}>4</Text>
            <Text style={[styles.headerCell, styles.colUnit]}>5</Text>
            <Text style={[styles.headerCell, styles.colQty]}>6</Text>
            <Text style={[styles.headerCell, styles.colPrice]}>7</Text>
            <Text style={[styles.headerCell, styles.colSum, { borderRight: "none" }]}>8</Text>
          </View>
          {data.items.map((item, index) => (
            <View style={styles.row} key={index}>
              <Text style={[styles.cell, styles.colNum]}>{index + 1}</Text>
              <Text style={[styles.cell, styles.colName]}>{item.name || "—"}</Text>
              <Text style={[styles.cell, styles.colDate]}>{item.performedDate || "—"}</Text>
              <Text style={[styles.cell, styles.colReport]}>{item.reportInfo || "—"}</Text>
              <Text style={[styles.cell, styles.colUnit]}>{item.unit || "—"}</Text>
              <Text style={[styles.cell, styles.colQty]}>{formatNumber(item.quantity)}</Text>
              <Text style={[styles.cell, styles.colPrice]}>{formatNumber(item.price)}</Text>
              <Text style={[styles.cell, styles.colSum, { borderRight: "none" }]}>
                {formatNumber(item.quantity * item.price)}
              </Text>
            </View>
          ))}
          <View style={styles.row}>
            <Text style={[styles.cell, styles.colNum]} />
            <Text style={[styles.cell, styles.colName, { fontWeight: "bold" }]}>Итого</Text>
            <Text style={[styles.cell, styles.colDate, { textAlign: "center" }]}>х</Text>
            <Text style={[styles.cell, styles.colReport]} />
            <Text style={[styles.cell, styles.colUnit]} />
            <Text style={[styles.cell, styles.colQty]} />
            <Text style={[styles.cell, styles.colPrice]} />
            <Text style={[styles.cell, styles.colSum, { borderRight: "none", fontWeight: "bold" }]}>
              {formatNumber(total)}
            </Text>
          </View>
        </View>

        <View style={styles.belowTable}>
          <View style={styles.belowTableLine}>
            <Text style={styles.belowTableLabel}>Сведения об использовании запасов, полученных от заказчика</Text>
            <Text style={styles.belowTableValue}>{data.reservesInfo || ""}</Text>
          </View>
          <Text style={styles.caption}>наименование, количество, стоимость</Text>
          <Text style={{ marginTop: 6 }}>
            Приложение: Перечень документации, в том числе отчёт(ы) о маркетинговых, научных
            исследованиях, консультационных и прочих услугах (обязательны при его (их) наличии) на{" "}
            {data.attachmentPages || "_____"} страниц
          </Text>
        </View>
      </Page>

      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={{ alignSelf: "flex-end", marginBottom: 16 }}>Оборотная сторона формы Р-1</Text>

        <View style={styles.signatureBlock}>
          <View style={styles.signaturePartyHalf}>
            <View style={styles.signatureFieldRow}>
              <Text>Сдал (Исполнитель)</Text>
              <SignatureSlot signature={signature} />
            </View>
            <Text style={styles.signatureCaption}>должность · подпись · расшифровка подписи</Text>
            <View style={styles.stampRow}>
              <Text>М.П.</Text>
              <StampOverlay stamp={stamp} />
            </View>
          </View>

          <View style={styles.signaturePartyHalf}>
            <View style={styles.signatureFieldRow}>
              <Text>Принял (Заказчик)</Text>
              <SignatureSlot signature={null} />
            </View>
            <Text style={styles.signatureCaption}>должность · подпись · расшифровка подписи</Text>
            <Text style={{ marginTop: 28 }}>
              Дата подписания (принятия) работ (услуг) ______________________
            </Text>
            <Text style={{ marginTop: 10 }}>М.П.</Text>
          </View>
        </View>

        <Text style={styles.footnote}>
          *Применяется для приёмки-передачи выполненных работ (оказанных услуг), за исключением
          строительно-монтажных работ.
        </Text>
        <Text style={styles.footnote}>
          **Заполняется в случае, если даты выполненных работ (оказанных услуг) приходятся на различные
          периоды, а также в случае, если даты выполнения работ (оказания услуг) и даты подписания
          (принятия) работ (услуг) различны.
        </Text>
        <Text style={styles.footnote}>
          ***Заполняется в случае наличия отчёта о научных исследованиях, маркетинговых,
          консультационных и прочих услугах.
        </Text>
      </Page>
    </Document>
  );
}
