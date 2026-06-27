"use client";

import { useId, useState } from "react";
import { Download, Loader2, Plus, Save, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUser } from "@/lib/hooks/useUser";
import { saveDocument } from "@/lib/supabase/documents";
import { formatTenge } from "@/lib/format";
import { calculatePayrollSheetEmployee } from "@/lib/documents/payrollSheetCalc";
import type { PayrollSheetData, PayrollSheetEmployee } from "@/lib/documents/types";

interface EditableEmployee extends PayrollSheetEmployee {
  id: number;
}

let nextId = 1;
const createEmployee = (): EditableEmployee => ({
  id: nextId++,
  fullName: "",
  personnelNumber: "",
  category: "рабочий",
  position: "",
  workConditions: "нормальные",
  tariffRate: 300000,
  hourlyRate: 0,
  daysWorked: 21,
  hoursWorked: 168,
  bonus: 0,
  sickLeave: 0,
  advance: 0,
  birthDate: "",
  familyStatus: "",
  note: "",
});

export function PayrollSheetForm() {
  const { user } = useUser();
  const [period, setPeriod] = useState("Июнь 2026");
  const [department, setDepartment] = useState("");
  const [employees, setEmployees] = useState<EditableEmployee[]>(() => [createEmployee()]);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function updateEmployee(id: number, patch: Partial<EditableEmployee>) {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
  function addEmployee() {
    setEmployees((prev) => [...prev, createEmployee()]);
  }
  function removeEmployee(id: number) {
    setEmployees((prev) => (prev.length > 1 ? prev.filter((e) => e.id !== id) : prev));
  }

  function buildData(): PayrollSheetData {
    return {
      period,
      department,
      employees: employees.map(
        ({
          fullName,
          personnelNumber,
          category,
          position,
          workConditions,
          tariffRate,
          hourlyRate,
          daysWorked,
          hoursWorked,
          bonus,
          sickLeave,
          advance,
          birthDate,
          familyStatus,
          note,
        }) => ({
          fullName,
          personnelNumber,
          category,
          position,
          workConditions,
          tariffRate,
          hourlyRate,
          daysWorked,
          hoursWorked,
          bonus,
          sickLeave,
          advance,
          birthDate,
          familyStatus,
          note,
        })
      ),
    };
  }

  const results = employees.map(calculatePayrollSheetEmployee);
  const totalToPay = results.reduce((sum, r) => sum + r.totalToPay, 0);

  async function handleDownload() {
    setMessage(null);
    setIsDownloading(true);
    try {
      const response = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payroll", data: buildData() }),
      });
      if (!response.ok) {
        const errorBody: { error?: unknown } | null = await response.json().catch(() => null);
        const detail = typeof errorBody?.error === "string" ? errorBody.error : null;
        setMessage(detail ? `Не удалось сформировать документ: ${detail}` : "Не удалось сформировать документ.");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payroll-sheet.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setMessage("Не удалось связаться с сервером. Попробуйте ещё раз.");
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleSaveToHistory() {
    if (!user) return;
    setIsSaving(true);
    setMessage(null);
    try {
      await saveDocument({
        userId: user.id,
        type: "payroll",
        title: `Расчётная ведомость — ${period}`,
        data: buildData(),
      });
      setMessage("Сохранено в историю");
    } catch {
      setMessage("Не удалось сохранить в историю");
    } finally {
      setIsSaving(false);
    }
  }

  const periodId = useId();
  const departmentId = useId();

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Расчётная ведомость (Т-1)</CardTitle>
          <CardDescription>ОПВ и ИПН считаются автоматически</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={periodId} className="text-sm text-text-muted">
              Период
            </Label>
            <Input id={periodId} value={period} onChange={(e) => setPeriod(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={departmentId} className="text-sm text-text-muted">
              Структурное подразделение
            </Label>
            <Input id={departmentId} value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>
          <p className="text-xs text-text-muted">
            Колонки ведомости, не относящиеся к окладу (премии по графику, пособия, сверхурочные и
            т.д.), в PDF выводятся пустыми — заполните их в распечатанном документе при необходимости.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Сотрудники</CardTitle>
            <CardDescription>Оклад (тариф), отработано, премия, аванс</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addEmployee} className="gap-1">
            <Plus className="h-4 w-4" />
            Добавить
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px] text-text-muted">ФИО</TableHead>
                <TableHead className="min-w-[140px] text-text-muted">Должность</TableHead>
                <TableHead className="min-w-[140px] text-text-muted">Оклад</TableHead>
                <TableHead className="w-24 text-text-muted">Дней</TableHead>
                <TableHead className="min-w-[120px] text-text-muted">Премия</TableHead>
                <TableHead className="min-w-[120px] text-text-muted">Аванс</TableHead>
                <TableHead className="w-32 text-right text-text-muted">К выдаче</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => {
                const result = results.find((r) => r.employee === employee);
                return (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Input
                        value={employee.fullName}
                        onChange={(e) => updateEmployee(employee.id, { fullName: e.target.value })}
                        placeholder="Фамилия Имя Отчество"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={employee.position}
                        onChange={(e) => updateEmployee(employee.id, { position: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        className="font-tabular"
                        value={employee.tariffRate || ""}
                        onChange={(e) =>
                          updateEmployee(employee.id, { tariffRate: Math.max(0, Number(e.target.value) || 0) })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        className="font-tabular"
                        value={employee.daysWorked || ""}
                        onChange={(e) =>
                          updateEmployee(employee.id, { daysWorked: Math.max(0, Number(e.target.value) || 0) })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        className="font-tabular"
                        value={employee.bonus || ""}
                        onChange={(e) =>
                          updateEmployee(employee.id, { bonus: Math.max(0, Number(e.target.value) || 0) })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        className="font-tabular"
                        value={employee.advance || ""}
                        onChange={(e) =>
                          updateEmployee(employee.id, { advance: Math.max(0, Number(e.target.value) || 0) })
                        }
                      />
                    </TableCell>
                    <TableCell className="font-tabular text-right font-medium">
                      {result ? formatTenge(result.totalToPay) : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-text-muted hover:text-danger"
                        onClick={() => removeEmployee(employee.id)}
                        disabled={employees.length === 1}
                        aria-label="Удалить сотрудника"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="mt-5 flex justify-end rounded-lg bg-primary-bg px-4 py-3 text-base font-semibold text-primary">
            <span>Итого к выдаче: {formatTenge(totalToPay)}</span>
          </div>

          {message ? <p className="mt-3 text-xs text-text-muted">{message}</p> : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={handleDownload} disabled={isDownloading} className="gap-2">
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Скачать PDF
            </Button>
            <Button onClick={handleSaveToHistory} disabled={isSaving} variant="outline" className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Сохранить в историю
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
