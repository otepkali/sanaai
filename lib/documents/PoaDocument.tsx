import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { PDF_FONT_FAMILY } from "@/lib/pdf-fonts";
import { BORDER, SignatureSlot, StampOverlay } from "./pdf-elements";
import type { PoaData, CompanyRequisites } from "./types";

const styles = StyleSheet.create({
  page: {
    padding: "14mm 14mm",
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 9,
    color: "#000000",
  },
  headerBlock: {
    alignSelf: "flex-end",
    width: 260,
    textAlign: "right",
    // italic недоступен — Arimo не зарегистрирован для этого стиля
    marginBottom: 4,
  },
  formCode: {
    alignSelf: "flex-end",
    fontWeight: "bold",
    marginBottom: 14,
  },
  orgLine: {
    flexDirection: "row",
    marginBottom: 14,
  },
  orgLabel: {},
  orgValue: {
    flex: 1,
    borderBottom: BORDER,
    marginHorizontal: 6,
  },
  binLabel: {},
  binValue: {
    border: BORDER,
    minWidth: 140,
    padding: 3,
    marginLeft: 6,
  },
  fieldLine: {
    borderBottom: BORDER,
    minHeight: 14,
    marginBottom: 1,
  },
  fieldLabel: {
    marginBottom: 1,
  },
  caption: {
    fontSize: 7,
    // italic недоступен — Arimo не зарегистрирован для этого стиля
    color: "#444444",
    marginBottom: 8,
    textAlign: "center",
  },
  bankLine: {
    flexDirection: "row",
    marginBottom: 1,
  },
  bankLabel: {},
  bankValue: {
    flex: 1,
    borderBottom: BORDER,
    marginLeft: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 8,
  },
  dateIssue: {
    textAlign: "center",
    marginBottom: 10,
  },
  inlineLabelLine: {
    flexDirection: "row",
    marginBottom: 1,
  },
  inlineValue: {
    flex: 1,
    borderBottom: BORDER,
    marginLeft: 4,
  },
  idRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 1,
  },
  table: {
    borderTop: BORDER,
    borderLeft: BORDER,
    marginTop: 10,
    marginBottom: 4,
  },
  row: { flexDirection: "row" },
  headerCell: {
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 3,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
  },
  cell: {
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 4,
    minHeight: 16,
  },
  colNum: { flex: 0.6, textAlign: "center" },
  colName: { flex: 3 },
  colUnit: { flex: 1.3, textAlign: "center" },
  colQty: { flex: 2 },
  signatureSection: {
    marginTop: 24,
  },
  signatureFieldRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 6,
  },
  certifyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 18,
    gap: 24,
  },
  certifyHalf: {
    flex: 1,
  },
});

export function PoaDocument({
  data,
  requisites,
  signature,
  stamp,
}: {
  data: PoaData;
  requisites: CompanyRequisites;
  signature: Buffer | null;
  stamp: Buffer | null;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.headerBlock}>
          Приложение 6{"\n"}к приказу Министра финансов Республики Казахстан{"\n"}от 20 декабря 2012
          года № 562
        </Text>
        <Text style={styles.formCode}>Форма Д-1</Text>

        <View style={styles.orgLine}>
          <Text style={styles.orgLabel}>
            Организация (индивидуальный предприниматель)
          </Text>
          <Text style={styles.orgValue}>{requisites.companyName || ""}</Text>
          <Text style={styles.binLabel}>ИИН/БИН</Text>
          <Text style={styles.binValue}>{requisites.binIin || ""}</Text>
        </View>

        <Text style={styles.fieldLabel}>Доверенность действительна по</Text>
        <Text style={styles.fieldLine}>{data.validUntilRecipient || ""}</Text>
        <Text style={styles.caption}>наименование получателя, ИИН/БИН и его адрес</Text>

        <Text style={styles.fieldLine}>{data.validUntilPayer || ""}</Text>
        <Text style={styles.caption}>наименование плательщика, ИИН/БИН и его адрес</Text>

        <View style={styles.bankLine}>
          <Text style={styles.bankLabel}>Счёт №</Text>
          <Text style={styles.bankValue}>{data.bankAccount || ""}</Text>
          <Text>в</Text>
          <Text style={styles.bankValue}>{data.bankName || ""}</Text>
        </View>
        <Text style={styles.caption}>наименование банка</Text>

        <Text style={styles.title}>ДОВЕРЕННОСТЬ № {data.poaNumber || "—"}</Text>
        <Text style={styles.dateIssue}>Дата выдачи {data.issueDate || "—"}</Text>

        <View style={styles.inlineLabelLine}>
          <Text>Выдана</Text>
          <Text style={styles.inlineValue}>
            {data.issuedToPosition || ""}, {data.issuedToName || ""}
          </Text>
        </View>
        <Text style={styles.caption}>должность, фамилия, имя, отчество</Text>

        <View style={styles.idRow}>
          <Text>Удостоверение личности (паспорт) серии {data.idDocumentSeries || "—"}</Text>
          <Text>№ {data.idDocumentNumber || "—"}</Text>
          <Text>от {data.idDocumentDate || "—"}</Text>
        </View>
        <View style={styles.inlineLabelLine}>
          <Text>выдан</Text>
          <Text style={styles.inlineValue}>{data.idDocumentIssuedBy || ""}</Text>
        </View>
        <Text style={styles.caption}>кем выдано удостоверение (паспорт) и когда</Text>

        <View style={styles.inlineLabelLine}>
          <Text>На получение от</Text>
          <Text style={styles.inlineValue}>{data.supplierName || ""}</Text>
        </View>
        <Text style={styles.caption}>наименование поставщика</Text>

        <View style={styles.inlineLabelLine}>
          <Text>активов по</Text>
          <Text style={styles.inlineValue}>{data.documentBasis || ""}</Text>
        </View>
        <Text style={styles.caption}>наименование, номер и дата документа</Text>

        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.headerCell, styles.colNum]}>Номер по порядку</Text>
            <Text style={[styles.headerCell, styles.colName]}>Наименование активов</Text>
            <Text style={[styles.headerCell, styles.colUnit]}>Единица измерения</Text>
            <Text style={[styles.headerCell, styles.colQty, { borderRight: "none" }]}>
              Количество (прописью)
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.headerCell, styles.colNum]}>1</Text>
            <Text style={[styles.headerCell, styles.colName]}>2</Text>
            <Text style={[styles.headerCell, styles.colUnit]}>3</Text>
            <Text style={[styles.headerCell, styles.colQty, { borderRight: "none" }]}>4</Text>
          </View>
          {data.items.map((item, index) => (
            <View style={styles.row} key={index}>
              <Text style={[styles.cell, styles.colNum]}>{index + 1}</Text>
              <Text style={[styles.cell, styles.colName]}>{item.name || ""}</Text>
              <Text style={[styles.cell, styles.colUnit]}>{item.unit || ""}</Text>
              <Text style={[styles.cell, styles.colQty, { borderRight: "none" }]}>
                {item.quantityInWords || ""}
              </Text>
            </View>
          ))}
          <View style={styles.row}>
            <Text style={[styles.cell, styles.colNum]} />
            <Text style={[styles.cell, styles.colName]} />
            <Text style={[styles.cell, styles.colUnit, { fontWeight: "bold", textAlign: "center" }]}>
              Итого
            </Text>
            <Text style={[styles.cell, styles.colQty, { borderRight: "none" }]} />
          </View>
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.signatureFieldRow}>
            <Text>Подпись лица, получившего доверенность</Text>
            <SignatureSlot signature={null} />
          </View>

          <View style={styles.certifyRow}>
            <Text>удостоверяем:</Text>
          </View>

          <View style={styles.certifyRow}>
            <View style={[styles.certifyHalf, { position: "relative" }]}>
              <Text>М.П.</Text>
              <StampOverlay stamp={stamp} />
            </View>
          </View>

          <View style={styles.certifyRow}>
            <View style={styles.certifyHalf}>
              <Text>Руководитель организации</Text>
              <Text style={{ fontSize: 7.5, color: "#444444" }}>(индивидуальный предприниматель)</Text>
              <View style={styles.signatureFieldRow}>
                <SignatureSlot signature={signature} />
                <Text>/{requisites.directorName || "—"}/</Text>
              </View>
            </View>
            <View style={styles.certifyHalf}>
              <Text>Главный бухгалтер</Text>
              <View style={styles.signatureFieldRow}>
                <SignatureSlot signature={null} />
                <Text>/{requisites.accountantName || "—"}/</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
