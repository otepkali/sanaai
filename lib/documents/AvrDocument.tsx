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
    fontSize: 9,
    marginBottom: 2,
  },
  formCode: {
    alignSelf: "flex-end",
    fontWeight: "bold",
    fontSize: 9,
    marginBottom: 6,
  },
  binRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  binLabel: {
    fontWeight: "bold",
    marginRight: 6,
  },
  binValue: {
    border: BORDER,
    minWidth: 140,
    padding: 2,
    fontSize: 10,
  },
  partyLine: {
    flexDirection: "row",
    marginBottom: 1,
  },
  partyLabel: {
    fontWeight: "bold",
    minWidth: 70,
  },
  partyValue: {
    flex: 1,
    borderBottom: BORDER,
    marginLeft: 4,
    paddingBottom: 1,
  },
  caption: {
    fontSize: 8,
    color: "#444444",
    marginBottom: 4,
    marginLeft: 74,
  },
  contractLine: {
    flexDirection: "row",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
    marginTop: 4,
  },
  titleText: {
    fontSize: 11,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
    paddingTop: 4,
  },
  docNumberBox: {
    flexDirection: "row",
    borderTop: BORDER,
    borderLeft: BORDER,
    marginLeft: 10,
  },
  docNumberCell: {
    width: 80,
    borderRight: BORDER,
    borderBottom: BORDER,
  },
  docNumberHeader: {
    fontSize: 8,
    padding: 2,
    borderBottom: BORDER,
    textAlign: "center",
  },
  docNumberValue: {
    padding: 4,
    minHeight: 14,
    textAlign: "center",
    fontSize: 10,
  },
  reservesBlock: {
    marginBottom: 4,
  },
  reservesLine: {
    flexDirection: "row",
    marginBottom: 1,
  },
  reservesValue: {
    flex: 1,
    borderBottom: BORDER,
    marginLeft: 4,
  },
  reservesCaption: {
    fontSize: 8,
    color: "#444444",
    textAlign: "center",
    marginBottom: 4,
  },
  attachmentText: {
    fontSize: 9,
    marginBottom: 8,
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
    justifyContent: "center",
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
    padding: 2,
    fontSize: 9,
  },
  colNum:    { flex: 0.4, textAlign: "center" },
  colName:   { flex: 3 },
  colDate:   { flex: 1, textAlign: "center" },
  colReport: { flex: 1.6 },
  colUnit:   { flex: 0.8, textAlign: "center" },
  colQty:    { flex: 0.8, textAlign: "right" },
  colPrice:  { flex: 1, textAlign: "right" },
  colSum:    { flex: 1, textAlign: "right" },
  colDone:   { flex: 2.8 },
  page2: {
    padding: "14mm 16mm",
    fontFamily: PDF_FONT_FAMILY_SERIF,
    fontSize: 10,
    color: "#000000",
  },
  page2Header: {
    alignSelf: "flex-end",
    fontSize: 10,
    marginBottom: 20,
  },
  signaturesTable: {
    flexDirection: "row",
    borderTop: BORDER,
    borderLeft: BORDER,
    marginBottom: 0,
  },
  sigCell: {
    flex: 1,
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 8,
    minHeight: 80,
  },
  sigLine: {
    fontSize: 10,
    marginBottom: 4,
  },
  sigCaption: {
    fontSize: 8,
    color: "#444444",
  },
  stampTableRow: {
    flexDirection: "row",
    borderLeft: BORDER,
  },
  stampCell: {
    flex: 1,
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 8,
    minHeight: 60,
  },
  stampRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  footnote: {
    marginTop: 10,
    fontSize: 8,
    color: "#444444",
    lineHeight: 1.4,
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
  const executorLine = [
    requisites.companyName,
    requisites.binIin ? `БИН/ИИН ${requisites.binIin}` : null,
    requisites.address,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Document>
      {/* СТРАНИЦА 1 */}
      <Page size="A4" style={styles.page}>

        <Text style={styles.headerBlock}>
          {"Приложение 50\nк приказу Министра финансов\nРеспублики Казахстан\nот 20 декабря 2012 года № 562"}
        </Text>
        <Text style={styles.formCode}>форма Р-1</Text>

        <View style={styles.binRow}>
          <Text style={styles.binLabel}>ИИН/БИН</Text>
          <Text style={styles.binValue}>{requisites.binIin || ""}</Text>
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

        <View style={styles.contractLine}>
          <Text>{"Договор (контракт)___ №___ «___» "}</Text>
          <Text>{data.contractDate || "________"}</Text>
          <Text>{" 20__ г."}</Text>
        </View>

        {/* Заголовок + Номер/Дата в одну строку */}
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>
            АКТ ВЫПОЛНЕННЫХ РАБОТ (ОКАЗАННЫХ УСЛУГ)*
          </Text>
          <View style={styles.docNumberBox}>
            <View style={styles.docNumberCell}>
              <Text style={styles.docNumberHeader}>{"Номер\nдокумента"}</Text>
              <Text style={styles.docNumberValue}>{data.documentNumber || ""}</Text>
            </View>
            <View style={styles.docNumberCell}>
              <Text style={styles.docNumberHeader}>{"Дата\nсоставления"}</Text>
              <Text style={styles.docNumberValue}>{data.documentDate || ""}</Text>
            </View>
          </View>
        </View>

        {/* Сведения о запасах — ДО таблицы */}
        <View style={styles.reservesBlock}>
          <View style={styles.reservesLine}>
            <Text>Сведения об использовании запасов, полученных от заказчика</Text>
            <Text style={styles.reservesValue}>{data.reservesInfo || ""}</Text>
          </View>
          <Text style={styles.reservesCaption}>наименование, количество, стоимость</Text>
          <Text style={styles.attachmentText}>
            {"Приложение: Перечень документации, в том числе отчет(ы) о маркетинговых, научных исследованиях, консультационных и прочих услугах (обязательны при его (их) наличии) на "}
            {data.attachmentPages || "_______________"}
            {" страниц"}
          </Text>
        </View>

        {/* Таблица */}
        <View style={styles.table}>
          <View style={styles.row}>
            <View style={[styles.headerCellMerged, styles.colNum]}>
              <Text style={styles.headerCellMergedText}>{"Номер по порядку"}</Text>
            </View>
            <View style={[styles.headerCellMerged, styles.colName]}>
              <Text style={styles.headerCellMergedText}>
                {"Наименование работ (услуг)\n(в разрезе их подвидов в соответствии с технической спецификацией, заданием, графиком выполнения работ (услуг) при их наличии)"}
              </Text>
            </View>
            <View style={[styles.headerCellMerged, styles.colDate]}>
              <Text style={styles.headerCellMergedText}>{"Дата выполнения работ\n(оказания услуг)**"}</Text>
            </View>
            <View style={[styles.headerCellMerged, styles.colReport]}>
              <Text style={styles.headerCellMergedText}>
                {"Сведения об отчете о научных исследованиях, маркетинговых, консультационных и прочих услугах (дата, номер, количество страниц) (при их наличии)***"}
              </Text>
            </View>
            <View style={[styles.headerCellMerged, styles.colUnit]}>
              <Text style={styles.headerCellMergedText}>{"Единица измерения"}</Text>
            </View>
            <View style={[styles.headerGroupWrap, styles.colDone]}>
              <Text style={styles.headerGroupLabel}>{"Выполнено работ (оказано услуг)"}</Text>
              <View style={styles.headerGroupRow}>
                <Text style={[styles.headerCell, styles.colQty]}>{"количество"}</Text>
                <Text style={[styles.headerCell, styles.colPrice]}>{"цена за единицу"}</Text>
                <Text style={[styles.headerCell, styles.colSum]}>{"стоимость"}</Text>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={[styles.headerCell, styles.colNum]}>1</Text>
            <Text style={[styles.headerCell, styles.colName]}>2</Text>
            <Text style={[styles.headerCell, styles.colDate]}>3</Text>
            <Text style={[styles.headerCell, styles.colReport]}>4</Text>
            <Text style={[styles.headerCell, styles.colUnit]}>5</Text>
            <Text style={[styles.headerCell, styles.colQty]}>6</Text>
            <Text style={[styles.headerCell, styles.colPrice]}>7</Text>
            <Text style={[styles.headerCell, styles.colSum]}>8</Text>
          </View>

          {data.items.map((item, index) => (
            <View style={styles.row} key={index}>
              <Text style={[styles.cell, styles.colNum]}>{index + 1}</Text>
              <Text style={[styles.cell, styles.colName]}>{item.name || ""}</Text>
              <Text style={[styles.cell, styles.colDate]}>{item.performedDate || ""}</Text>
              <Text style={[styles.cell, styles.colReport]}>{item.reportInfo || ""}</Text>
              <Text style={[styles.cell, styles.colUnit]}>{item.unit || ""}</Text>
              <Text style={[styles.cell, styles.colQty]}>{formatNumber(item.quantity)}</Text>
              <Text style={[styles.cell, styles.colPrice]}>{formatNumber(item.price)}</Text>
              <Text style={[styles.cell, styles.colSum]}>{formatNumber(item.quantity * item.price)}</Text>
            </View>
          ))}

          {/* Итого — "х" в колонке 7, "Итого" в колонке 5, как в оригинале */}
          <View style={styles.row}>
            <Text style={[styles.cell, styles.colNum]} />
            <Text style={[styles.cell, styles.colName]} />
            <Text style={[styles.cell, styles.colDate]} />
            <Text style={[styles.cell, styles.colReport]} />
            <Text style={[styles.cell, styles.colUnit, { fontWeight: "bold" }]}>{"Итого"}</Text>
            <Text style={[styles.cell, styles.colQty]} />
            <Text style={[styles.cell, styles.colPrice, { textAlign: "center" }]}>{"х"}</Text>
            <Text style={[styles.cell, styles.colSum, { fontWeight: "bold" }]}>{formatNumber(total)}</Text>
          </View>
        </View>
      </Page>

      {/* СТРАНИЦА 2 — оборотная сторона */}
      <Page size="A4" style={styles.page2}>
        <Text style={styles.page2Header}>Оборотная сторона формы Р-1</Text>

        <View style={styles.signaturesTable}>
          <View style={styles.sigCell}>
            <Text style={styles.sigLine}>{"Сдал (Исполнитель)_____/_____/____"}</Text>
            <Text style={styles.sigCaption}>{"должность    подпись    расшифровка подписи"}</Text>
            <View style={{ marginTop: 8 }}>
              <SignatureSlot signature={signature} />
            </View>
          </View>
          <View style={styles.sigCell}>
            <Text style={styles.sigLine}>{"Принял (Заказчик)____/_____/____"}</Text>
            <Text style={styles.sigCaption}>{"должность    подпись    расшифровка подписи"}</Text>
          </View>
        </View>

        <View style={styles.stampTableRow}>
          <View style={styles.stampCell}>
            <View style={styles.stampRow}>
              <Text>{"М.П."}</Text>
              <StampOverlay stamp={stamp} />
            </View>
          </View>
          <View style={styles.stampCell}>
            <Text>{"Дата подписания (принятия) работ\n(услуг) ________________________"}</Text>
            <Text style={{ marginTop: 12 }}>{"М.П."}</Text>
          </View>
        </View>

        <Text style={styles.footnote}>
          {"*Применяется для приемки-передачи выполненных работ (оказанных услуг), за исключением строительно-монтажных работ."}
        </Text>
        <Text style={styles.footnote}>
          {"**Заполняется в случае, если даты выполненных работ (оказанных услуг) приходятся на различные периоды, а также в случае, если даты выполнения работ (оказания услуг) и даты подписания (принятия) работ (услуг) различны."}
        </Text>
        <Text style={styles.footnote}>
          {"***Заполняется в случае наличия отчета о научных исследованиях, маркетинговых, консультационных и прочих услугах."}
        </Text>
      </Page>
    </Document>
  );
}