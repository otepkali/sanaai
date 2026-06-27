import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { PDF_FONT_FAMILY } from "@/lib/pdf-fonts";
import { BORDER } from "./pdf-elements";
import { formatDecimal } from "@/lib/format";
import { calculatePayrollSheetEmployee } from "./payrollSheetCalc";
import type { PayrollSheetData, CompanyRequisites } from "./types";

const styles = StyleSheet.create({
  page: {
    padding: "10mm",
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 7,
    color: "#000000",
  },
  headerBlock: {
    alignSelf: "flex-end",
    width: 260,
    textAlign: "right",
    fontSize: 8,
    marginBottom: 4,
  },
  formCode: {
    alignSelf: "flex-end",
    fontWeight: "bold",
    fontSize: 9,
    marginBottom: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 2,
  },
  period: {
    textAlign: "center",
    marginBottom: 10,
  },
  binRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  table: {
    borderTop: BORDER,
    borderLeft: BORDER,
  },
  row: { flexDirection: "row" },
  headerCell: {
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 2,
    fontSize: 6.5,
    fontWeight: "bold",
    textAlign: "center",
  },
  numCell: {
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 2,
    fontSize: 6.5,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "#f0f0f0",
  },
  cell: {
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 2,
    fontSize: 7,
  },
  pageFooter: {
    alignSelf: "flex-end",
    marginBottom: 10,
  },
});

function n(value: number): string {
  return value ? formatDecimal(value, 2) : "";
}

// Ширины колонок страницы 1 (1-23), суммарно ~ширина A3 landscape за полями
const W1 = {
  num: 0.6,
  tabNum: 1,
  name: 3.2,
  category: 1.4,
  position: 1.8,
  conditions: 1.4,
  tariff: 1.6,
  hourly: 1.4,
  days: 0.8,
  hours: 0.8,
  hAndSum: 1.1,
  oneSum: 1.1,
};

const W2 = {
  premiumCode: 0.8,
  premiumPct: 0.8,
  premiumSum: 1.1,
  sickMonth: 0.8,
  sickDays: 0.7,
  sickSum: 1.1,
  other: 1.1,
  total: 1.3,
  advance: 1.2,
  incomeMonth: 1.2,
  incomeYear: 1.2,
  ipnMonth: 1.2,
  ipnYear: 1.2,
  opvMonth: 1.2,
  opvYear: 1.2,
  exec: 1,
  otherCode: 0.7,
  otherSum: 1,
  withheld: 1.3,
  debt: 1.2,
  payAmount: 1.2,
  payTotal: 1.3,
  birth: 1.1,
  family: 1.1,
  vacation: 1.2,
  note: 1.4,
};

export function PayrollSheetDocument({
  data,
  requisites,
}: {
  data: PayrollSheetData;
  requisites: CompanyRequisites;
}) {
  const results = data.employees.map(calculatePayrollSheetEmployee);

  return (
    <Document>
      <Page size="A3" orientation="landscape" style={styles.page}>
        <Text style={styles.headerBlock}>
          Приложение 8 к приказу Министра финансов{"\n"}Республики Казахстан от 20.12.2012 года № 562
        </Text>
        <Text style={styles.formCode}>Форма Т-1</Text>

        <Text style={styles.title}>РАСЧЕТНАЯ ВЕДОМОСТЬ (КНИГА)</Text>
        <Text style={styles.subtitle}>{data.department || "структурные подразделения"}</Text>
        <Text style={styles.period}>{data.period || ""}</Text>

        <View style={styles.binRow}>
          <Text>ИИН/БИН: {requisites.binIin || ""}</Text>
          <Text style={{ marginLeft: 16 }}>{requisites.companyName || ""}</Text>
        </View>

        <View style={styles.table}>
          {/* Группа-заголовки */}
          <View style={styles.row}>
            <Text style={[styles.headerCell, { flex: W1.num }]} />
            <Text style={[styles.headerCell, { flex: W1.tabNum }]} />
            <Text style={[styles.headerCell, { flex: W1.name }]} />
            <Text style={[styles.headerCell, { flex: W1.category }]} />
            <Text style={[styles.headerCell, { flex: W1.position }]} />
            <Text style={[styles.headerCell, { flex: W1.conditions }]} />
            <Text style={[styles.headerCell, { flex: W1.tariff }]} />
            <Text style={[styles.headerCell, { flex: W1.hourly }]} />
            <Text style={[styles.headerCell, { flex: W1.days + W1.hours }]}>Отработано</Text>
            <Text style={[styles.headerCell, { flex: (W1.hAndSum + W1.hAndSum) * 5 + W1.oneSum }]}>
              Начислено по видам оплат
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.headerCell, { flex: W1.num }]}>Номер по порядку</Text>
            <Text style={[styles.headerCell, { flex: W1.tabNum }]}>Табельный номер</Text>
            <Text style={[styles.headerCell, { flex: W1.name }]}>Фамилия, имя, отчество</Text>
            <Text style={[styles.headerCell, { flex: W1.category }]}>Категория персонала</Text>
            <Text style={[styles.headerCell, { flex: W1.position }]}>Профессия, должность</Text>
            <Text style={[styles.headerCell, { flex: W1.conditions }]}>Условия труда</Text>
            <Text style={[styles.headerCell, { flex: W1.tariff }]}>Тарифный разряд (оклад), в тенге</Text>
            <Text style={[styles.headerCell, { flex: W1.hourly }]}>Часовая (дневная) тарифная ставка</Text>
            <Text style={[styles.headerCell, { flex: W1.days }]}>дней</Text>
            <Text style={[styles.headerCell, { flex: W1.hours }]}>часов</Text>
            <Text style={[styles.headerCell, { flex: W1.hAndSum * 2 }]}>повременно</Text>
            <Text style={[styles.headerCell, { flex: W1.hAndSum * 2 }]}>сдельно</Text>
            <Text style={[styles.headerCell, { flex: W1.hAndSum * 2 }]}>за работу в ночное время</Text>
            <Text style={[styles.headerCell, { flex: W1.hAndSum * 2 }]}>за работу в праздничные дни</Text>
            <Text style={[styles.headerCell, { flex: W1.oneSum }]}>за работу в выходные дни</Text>
            <Text style={[styles.headerCell, { flex: (W1.hAndSum * 2) * 2 }]}>
              доплата за работу в сверхурочное время
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.numCell, { flex: W1.num }]}>1</Text>
            <Text style={[styles.numCell, { flex: W1.tabNum }]}>2</Text>
            <Text style={[styles.numCell, { flex: W1.name }]}>3</Text>
            <Text style={[styles.numCell, { flex: W1.category }]}>4</Text>
            <Text style={[styles.numCell, { flex: W1.position }]}>5</Text>
            <Text style={[styles.numCell, { flex: W1.conditions }]}>6</Text>
            <Text style={[styles.numCell, { flex: W1.tariff }]}>7</Text>
            <Text style={[styles.numCell, { flex: W1.hourly }]}>8</Text>
            <Text style={[styles.numCell, { flex: W1.days }]}>9</Text>
            <Text style={[styles.numCell, { flex: W1.hours }]}>10</Text>
            <Text style={[styles.numCell, { flex: W1.hAndSum }]}>11</Text>
            <Text style={[styles.numCell, { flex: W1.hAndSum }]}>12</Text>
            <Text style={[styles.numCell, { flex: W1.hAndSum }]}>13</Text>
            <Text style={[styles.numCell, { flex: W1.hAndSum }]}>14</Text>
            <Text style={[styles.numCell, { flex: W1.hAndSum }]}>15</Text>
            <Text style={[styles.numCell, { flex: W1.hAndSum }]}>16</Text>
            <Text style={[styles.numCell, { flex: W1.hAndSum }]}>17</Text>
            <Text style={[styles.numCell, { flex: W1.hAndSum }]}>18</Text>
            <Text style={[styles.numCell, { flex: W1.oneSum }]}>19</Text>
            <Text style={[styles.numCell, { flex: W1.hAndSum }]}>20</Text>
            <Text style={[styles.numCell, { flex: W1.hAndSum }]}>21</Text>
            <Text style={[styles.numCell, { flex: W1.hAndSum }]}>22</Text>
            <Text style={[styles.numCell, { flex: W1.hAndSum, borderRight: "none" }]}>23</Text>
          </View>

          {results.map(({ employee, accrued }, index) => (
            <View style={styles.row} key={index}>
              <Text style={[styles.cell, { flex: W1.num }]}>{index + 1}</Text>
              <Text style={[styles.cell, { flex: W1.tabNum }]}>{employee.personnelNumber}</Text>
              <Text style={[styles.cell, { flex: W1.name }]}>{employee.fullName}</Text>
              <Text style={[styles.cell, { flex: W1.category }]}>{employee.category}</Text>
              <Text style={[styles.cell, { flex: W1.position }]}>{employee.position}</Text>
              <Text style={[styles.cell, { flex: W1.conditions }]}>{employee.workConditions}</Text>
              <Text style={[styles.cell, { flex: W1.tariff }]}>{n(employee.tariffRate)}</Text>
              <Text style={[styles.cell, { flex: W1.hourly }]}>{n(employee.hourlyRate)}</Text>
              <Text style={[styles.cell, { flex: W1.days }]}>{employee.daysWorked || ""}</Text>
              <Text style={[styles.cell, { flex: W1.hours }]}>{employee.hoursWorked || ""}</Text>
              <Text style={[styles.cell, { flex: W1.hAndSum }]}>{employee.hoursWorked || ""}</Text>
              <Text style={[styles.cell, { flex: W1.hAndSum }]}>{n(accrued)}</Text>
              <Text style={[styles.cell, { flex: W1.hAndSum }]} />
              <Text style={[styles.cell, { flex: W1.hAndSum }]} />
              <Text style={[styles.cell, { flex: W1.hAndSum }]} />
              <Text style={[styles.cell, { flex: W1.hAndSum }]} />
              <Text style={[styles.cell, { flex: W1.hAndSum }]} />
              <Text style={[styles.cell, { flex: W1.hAndSum }]} />
              <Text style={[styles.cell, { flex: W1.oneSum }]} />
              <Text style={[styles.cell, { flex: W1.hAndSum }]} />
              <Text style={[styles.cell, { flex: W1.hAndSum }]} />
              <Text style={[styles.cell, { flex: W1.hAndSum }]} />
              <Text style={[styles.cell, { flex: W1.hAndSum, borderRight: "none" }]} />
            </View>
          ))}
        </View>

        <Text style={styles.pageFooter}>Продолжение — оборотная сторона формы Т-1</Text>
      </Page>

      <Page size="A3" orientation="landscape" style={styles.page}>
        <Text style={styles.headerBlock}>Оборотная сторона формы Т-1</Text>

        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.headerCell, { flex: W2.premiumCode + W2.premiumPct + W2.premiumSum }]}>
              Премия
            </Text>
            <Text style={[styles.headerCell, { flex: W2.sickMonth + W2.sickDays + W2.sickSum }]}>
              Пособие по временной нетрудоспособности
            </Text>
            <Text style={[styles.headerCell, { flex: W2.other }]}>Прочие начисления</Text>
            <Text style={[styles.headerCell, { flex: W2.total }]}>Итого начислено</Text>
            <Text style={[styles.headerCell, { flex: W2.advance }]}>
              Выдано за первую половину месяца (аванс)
            </Text>
            <Text style={[styles.headerCell, { flex: W2.incomeMonth + W2.incomeYear }]}>
              Облагаемый доход
            </Text>
            <Text style={[styles.headerCell, { flex: W2.ipnMonth + W2.ipnYear }]}>Подоходный налог</Text>
            <Text style={[styles.headerCell, { flex: W2.opvMonth + W2.opvYear }]}>
              Обязательные пенсионные взносы
            </Text>
            <Text style={[styles.headerCell, { flex: W2.exec }]}>по исполнительным документам</Text>
            <Text style={[styles.headerCell, { flex: W2.otherCode + W2.otherSum }]}>прочие</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.headerCell, { flex: W2.premiumCode }]}>код</Text>
            <Text style={[styles.headerCell, { flex: W2.premiumPct }]}>процент</Text>
            <Text style={[styles.headerCell, { flex: W2.premiumSum }]}>сумма, в тенге</Text>
            <Text style={[styles.headerCell, { flex: W2.sickMonth }]}>месяц</Text>
            <Text style={[styles.headerCell, { flex: W2.sickDays }]}>дни</Text>
            <Text style={[styles.headerCell, { flex: W2.sickSum }]}>сумма в тенге</Text>
            <Text style={[styles.headerCell, { flex: W2.other }]} />
            <Text style={[styles.headerCell, { flex: W2.total }]} />
            <Text style={[styles.headerCell, { flex: W2.advance }]} />
            <Text style={[styles.headerCell, { flex: W2.incomeMonth }]}>за текущий месяц</Text>
            <Text style={[styles.headerCell, { flex: W2.incomeYear }]}>с начала года</Text>
            <Text style={[styles.headerCell, { flex: W2.ipnMonth }]}>за текущий месяц</Text>
            <Text style={[styles.headerCell, { flex: W2.ipnYear }]}>с начала года</Text>
            <Text style={[styles.headerCell, { flex: W2.opvMonth }]}>за текущий месяц</Text>
            <Text style={[styles.headerCell, { flex: W2.opvYear }]}>с начала года</Text>
            <Text style={[styles.headerCell, { flex: W2.exec }]} />
            <Text style={[styles.headerCell, { flex: W2.otherCode }]}>код</Text>
            <Text style={[styles.headerCell, { flex: W2.otherSum, borderRight: "none" }]}>сумма в тенге</Text>
          </View>
          <View style={styles.row}>
            {[24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40].map((num, i) => (
              <Text
                key={num}
                style={[
                  styles.numCell,
                  {
                    flex: [
                      W2.premiumCode, W2.premiumPct, W2.premiumSum, W2.sickMonth, W2.sickDays, W2.sickSum,
                      W2.other, W2.total, W2.advance, W2.incomeMonth, W2.incomeYear, W2.ipnMonth, W2.ipnYear,
                      W2.opvMonth, W2.opvYear, W2.exec, W2.otherCode,
                    ][i],
                  },
                ]}
              >
                {num}
              </Text>
            ))}
            <Text style={[styles.numCell, { flex: W2.otherSum, borderRight: "none" }]}>41</Text>
          </View>

          {results.map(({ employee, totalAccrued, ipnBase, ipn, opv, vosms }, index) => (
            <View style={styles.row} key={index}>
              <Text style={[styles.cell, { flex: W2.premiumCode }]} />
              <Text style={[styles.cell, { flex: W2.premiumPct }]} />
              <Text style={[styles.cell, { flex: W2.premiumSum }]}>{n(employee.bonus)}</Text>
              <Text style={[styles.cell, { flex: W2.sickMonth }]} />
              <Text style={[styles.cell, { flex: W2.sickDays }]} />
              <Text style={[styles.cell, { flex: W2.sickSum }]}>{n(employee.sickLeave)}</Text>
              <Text style={[styles.cell, { flex: W2.other }]} />
              <Text style={[styles.cell, { flex: W2.total, fontWeight: "bold" }]}>{n(totalAccrued)}</Text>
              <Text style={[styles.cell, { flex: W2.advance }]}>{n(employee.advance)}</Text>
              <Text style={[styles.cell, { flex: W2.incomeMonth }]}>{n(ipnBase)}</Text>
              <Text style={[styles.cell, { flex: W2.incomeYear }]} />
              <Text style={[styles.cell, { flex: W2.ipnMonth }]}>{n(ipn)}</Text>
              <Text style={[styles.cell, { flex: W2.ipnYear }]} />
              <Text style={[styles.cell, { flex: W2.opvMonth }]}>{n(opv)}</Text>
              <Text style={[styles.cell, { flex: W2.opvYear }]} />
              <Text style={[styles.cell, { flex: W2.exec }]} />
              <Text style={[styles.cell, { flex: W2.otherCode }]} />
              <Text style={[styles.cell, { flex: W2.otherSum, borderRight: "none" }]}>{n(vosms)}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.table, { marginTop: 14 }]}>
          <View style={styles.row}>
            <Text style={[styles.headerCell, { flex: W2.withheld }]}>Всего удержано</Text>
            <Text style={[styles.headerCell, { flex: W2.debt }]}>Задолженность за работником</Text>
            <Text style={[styles.headerCell, { flex: W2.payAmount + W2.payTotal }]}>Сумма</Text>
            <Text style={[styles.headerCell, { flex: W2.birth }]}>Дата рождения</Text>
            <Text style={[styles.headerCell, { flex: W2.family }]}>Семейное положение</Text>
            <Text style={[styles.headerCell, { flex: W2.vacation }]}>
              По какое число использован отпуск
            </Text>
            <Text style={[styles.headerCell, { flex: W2.note, borderRight: "none" }]}>Примечание</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.headerCell, { flex: W2.withheld }]} />
            <Text style={[styles.headerCell, { flex: W2.debt }]} />
            <Text style={[styles.headerCell, { flex: W2.payAmount }]}>заработной платы</Text>
            <Text style={[styles.headerCell, { flex: W2.payTotal }]}>итого к выдаче</Text>
            <Text style={[styles.headerCell, { flex: W2.birth }]} />
            <Text style={[styles.headerCell, { flex: W2.family }]} />
            <Text style={[styles.headerCell, { flex: W2.vacation }]} />
            <Text style={[styles.headerCell, { flex: W2.note, borderRight: "none" }]} />
          </View>
          <View style={styles.row}>
            <Text style={[styles.numCell, { flex: W2.withheld }]}>42</Text>
            <Text style={[styles.numCell, { flex: W2.debt }]}>43</Text>
            <Text style={[styles.numCell, { flex: W2.payAmount }]}>44</Text>
            <Text style={[styles.numCell, { flex: W2.payTotal }]}>45</Text>
            <Text style={[styles.numCell, { flex: W2.birth }]}>46</Text>
            <Text style={[styles.numCell, { flex: W2.family }]}>47</Text>
            <Text style={[styles.numCell, { flex: W2.vacation }]}>48</Text>
            <Text style={[styles.numCell, { flex: W2.note, borderRight: "none" }]}>49</Text>
          </View>
          {results.map(({ employee, totalWithheld, totalToPay }, index) => (
            <View style={styles.row} key={index}>
              <Text style={[styles.cell, { flex: W2.withheld, fontWeight: "bold" }]}>{n(totalWithheld)}</Text>
              <Text style={[styles.cell, { flex: W2.debt }]} />
              <Text style={[styles.cell, { flex: W2.payAmount }]}>{n(totalToPay)}</Text>
              <Text style={[styles.cell, { flex: W2.payTotal, fontWeight: "bold" }]}>{n(totalToPay)}</Text>
              <Text style={[styles.cell, { flex: W2.birth }]}>{employee.birthDate}</Text>
              <Text style={[styles.cell, { flex: W2.family }]}>{employee.familyStatus}</Text>
              <Text style={[styles.cell, { flex: W2.vacation }]} />
              <Text style={[styles.cell, { flex: W2.note, borderRight: "none" }]}>{employee.note}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
