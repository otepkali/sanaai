import fs from "node:fs";
import path from "node:path";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { formatDateLong } from "@/lib/format";
import { PDF_FONT_FAMILY } from "@/lib/pdf-fonts";
import type { ReportData, ReportType } from "./types";

// Передаём готовый Buffer, а не путь к файлу: @react-pdf/image на Windows
// принимает букву диска ("C:") за протокол URL и пытается сделать сетевой
// fetch вместо чтения файла, из-за чего логотип не попадает в PDF.
const logoBuffer = fs.readFileSync(path.join(process.cwd(), "public", "logo.png"));

const TYPE_LABELS: Record<ReportType, string> = {
  fot: "Зарплата / ФОТ",
  simplified: "Упрощённая декларация (910)",
  vat: "НДС",
  comparison: "Сравнение режимов",
};

const BORDER = "1pt solid #000000";

const styles = StyleSheet.create({
  page: {
    padding: "16mm 14mm",
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 10,
    color: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: "1pt solid #999999",
  },
  logo: {
    width: 110,
    height: 41,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  appName: {
    fontSize: 9,
    color: "#555555",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  date: {
    fontSize: 10,
    color: "#555555",
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 4,
  },
  table: {
    borderTop: BORDER,
    borderLeft: BORDER,
    marginBottom: 18,
  },
  row: {
    flexDirection: "row",
  },
  cellLabel: {
    flex: 2,
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 6,
  },
  cellValue: {
    flex: 1,
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 6,
    textAlign: "right",
  },
  cellValueBold: {
    fontWeight: "bold",
  },
  footnote: {
    marginTop: 24,
    paddingTop: 10,
    borderTop: "1pt solid #999999",
    fontSize: 8,
    color: "#555555",
    lineHeight: 1.3,
  },
  wideTable: {
    borderTop: BORDER,
    borderLeft: BORDER,
    marginBottom: 18,
  },
  wideRow: {
    flexDirection: "row",
  },
  wideHeaderRow: {
    backgroundColor: "#eeeeee",
  },
  wideHeaderCell: {
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 3,
    fontSize: 7,
    fontWeight: "bold",
  },
  wideCell: {
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 3,
    fontSize: 7,
  },
  wideRowAlt: {
    backgroundColor: "#f7f7f7",
  },
});

export function ReportDocument({ data }: { data: ReportData }) {
  return (
    <Document>
      <Page size="A4" orientation={data.orientation ?? "portrait"} style={styles.page}>
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, не HTML img: alt не поддерживается */}
          <Image src={logoBuffer} style={styles.logo} />
          <View style={styles.headerRight}>
            <Text style={styles.appName}>Налоговый калькулятор Казахстана 2026</Text>
          </View>
        </View>

        <Text style={styles.title}>{TYPE_LABELS[data.type] ?? data.title}</Text>
        <Text style={styles.date}>{data.title} — {formatDateLong(data.date)}</Text>

        {data.inputs.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>Входные данные</Text>
            <View style={styles.table}>
              {data.inputs.map((row, index) => (
                <View style={styles.row} key={`input-${index}`}>
                  <Text style={styles.cellLabel}>{row.label}</Text>
                  <Text style={styles.cellValue}>{row.value}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.sectionLabel}>Результат</Text>
        {data.table ? (
          <View style={styles.wideTable}>
            <View style={[styles.wideRow, styles.wideHeaderRow]}>
              {data.table.columns.map((column, index) => (
                <Text
                  key={`col-${index}`}
                  style={[
                    styles.wideHeaderCell,
                    { flex: column.flex ?? 1, textAlign: column.align === "right" ? "right" : "left" },
                  ]}
                >
                  {column.label}
                </Text>
              ))}
            </View>
            {data.table.rows.map((row, rowIndex) => {
              const isBold = data.table!.boldRowIndexes?.includes(rowIndex) ?? false;
              return (
                <View
                  style={
                    rowIndex % 2 === 1 ? [styles.wideRow, styles.wideRowAlt] : styles.wideRow
                  }
                  key={`table-row-${rowIndex}`}
                >
                  {row.map((cell, cellIndex) => (
                    <Text
                      key={`cell-${rowIndex}-${cellIndex}`}
                      style={
                        isBold
                          ? [
                              styles.wideCell,
                              {
                                flex: data.table!.columns[cellIndex]?.flex ?? 1,
                                textAlign: data.table!.columns[cellIndex]?.align === "right" ? "right" : "left",
                              },
                              styles.cellValueBold,
                            ]
                          : [
                              styles.wideCell,
                              {
                                flex: data.table!.columns[cellIndex]?.flex ?? 1,
                                textAlign: data.table!.columns[cellIndex]?.align === "right" ? "right" : "left",
                              },
                            ]
                      }
                    >
                      {cell}
                    </Text>
                  ))}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.table}>
            {data.rows.map((row, index) => (
              <View style={styles.row} key={`row-${index}`}>
                <Text style={row.bold ? [styles.cellLabel, styles.cellValueBold] : styles.cellLabel}>
                  {row.label}
                </Text>
                <Text style={row.bold ? [styles.cellValue, styles.cellValueBold] : styles.cellValue}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footnote}>
          Калькулятор носит справочный характер. Ставки актуальны на 2026 год. Для официальных
          расчётов сверяйтесь с Налоговым кодексом РК и консультируйтесь с бухгалтером.
        </Text>
      </Page>
    </Document>
  );
}
