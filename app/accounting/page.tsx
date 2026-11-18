import { notFound } from "next/navigation";

// Раздел «Учёт и ведомости» временно скрыт: ссылки на него убраны из меню и
// лендинга, а прямой заход на /accounting отдаёт 404. Компоненты раздела
// (components/accounting, app/api/accounting) не удалены — чтобы вернуть
// раздел, восстановите эту страницу из git (коммит до скрытия) и ссылки.
export default function AccountingPage() {
  notFound();
}
