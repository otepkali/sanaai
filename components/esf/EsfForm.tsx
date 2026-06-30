"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/lib/hooks/useUser";
import { formatTenge } from "@/lib/format";
import { searchCounterparties, saveCounterparty, saveEsfDraft, type EsfCounterparty } from "@/lib/supabase/esf";
import { generateEsfXml } from "@/lib/esf/generate-xml";
import { SUPPLIER_CATEGORIES, BUYER_CATEGORIES, createEmptyEsfData, type EsfData } from "@/lib/esf/types";
import { EsfItemsTable } from "@/components/esf/EsfItemsTable";
import { SignAndSendButton } from "@/components/esf/SignAndSendButton";
import type { CompanyRequisites } from "@/lib/documents/types";

const TEST_MODE_KEY = "esf_test_mode";

export function EsfForm({ requisites }: { requisites: CompanyRequisites }) {
  const { user } = useUser();
  const [data, setData] = useState<EsfData>(() => {
    const initial = createEmptyEsfData();
    initial.sectionB.binIin = requisites.binIin;
    initial.sectionB.name = requisites.companyName;
    initial.sectionB.address = requisites.address;
    initial.sectionB1.kbe = requisites.kbe;
    initial.sectionB1.iik = requisites.iik;
    initial.sectionB1.bik = requisites.bik;
    initial.sectionB1.bankName = requisites.bankName;
    return initial;
  });

  const [buyerEmail, setBuyerEmail] = useState("");
  const [saveBuyer, setSaveBuyer] = useState(false);
  const [suggestions, setSuggestions] = useState<EsfCounterparty[]>([]);
  const [shipperSameAsSeller, setShipperSameAsSeller] = useState(true);
  const [consigneeSameAsBuyer, setConsigneeSameAsBuyer] = useState(true);
  const [showJointVenture, setShowJointVenture] = useState(false);
  const [showSupplierAgent, setShowSupplierAgent] = useState(false);
  const [showBuyerAgent, setShowBuyerAgent] = useState(false);
  const [testMode, setTestMode] = useState(false);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const buyerBinId = useId();
  const buyerNameId = useId();
  const buyerAddressId = useId();
  const buyerEmailId = useId();

  useEffect(() => {
    Promise.resolve().then(() => {
      setTestMode(localStorage.getItem(TEST_MODE_KEY) === "true");
    });
  }, []);

  function toggleTestMode(value: boolean) {
    setTestMode(value);
    localStorage.setItem(TEST_MODE_KEY, String(value));
  }

  useEffect(() => {
    if (data.sectionC.binIin.trim().length < 3) {
      Promise.resolve().then(() => setSuggestions([]));
      return;
    }
    const timeout = setTimeout(() => {
      searchCounterparties(data.sectionC.binIin).then(setSuggestions).catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [data.sectionC.binIin]);

  function applySuggestion(s: EsfCounterparty) {
    setData((prev) => ({ ...prev, sectionC: { ...prev.sectionC, binIin: s.binIin, name: s.name, address: s.address } }));
    setBuyerEmail(s.email);
    setSuggestions([]);
  }

  const totals = useMemo(() => {
    const totalSum = data.items.reduce((sum, item) => sum + item.sum, 0);
    const totalExcise = data.items.reduce((sum, item) => sum + item.exciseSum, 0);
    const totalVat = data.items.reduce((sum, item) => sum + item.vatSum, 0);
    return { totalSum, totalExcise, totalVat, totalSumWithTax: totalSum + totalExcise + totalVat };
  }, [data.items]);

  function buildData(): EsfData {
    const sectionD = { ...data.sectionD };
    if (shipperSameAsSeller) {
      sectionD.shipperBinIin = data.sectionB.binIin;
      sectionD.shipperName = data.sectionB.name;
      sectionD.shipperAddress = data.sectionB.address;
    }
    if (consigneeSameAsBuyer) {
      sectionD.consigneeBinIin = data.sectionC.binIin;
      sectionD.consigneeName = data.sectionC.name;
      sectionD.consigneeAddress = data.sectionC.address;
    }

    return {
      ...data,
      sectionD,
      totalSum: totals.totalSum,
      totalExcise: totals.totalExcise,
      totalVat: totals.totalVat,
      totalSumWithTax: totals.totalSumWithTax,
    };
  }

  async function maybeSaveCounterparty() {
    if (!saveBuyer || !user || !data.sectionC.binIin) return;
    try {
      await saveCounterparty(user.id, {
        binIin: data.sectionC.binIin,
        name: data.sectionC.name,
        address: data.sectionC.address,
        email: buyerEmail,
      });
    } catch (error) {
      console.error("Не удалось сохранить контрагента", error);
    }
  }

  async function handleDownloadXml() {
    setMessage(null);
    setIsDownloading(true);
    try {
      await maybeSaveCounterparty();
      const response = await fetch("/api/esf/download-xml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildData()),
      });
      if (!response.ok) {
        const errorBody: { error?: unknown } | null = await response.json().catch(() => null);
        const detail = typeof errorBody?.error === "string" ? errorBody.error : null;
        setMessage(detail ? `Не удалось сформировать XML: ${detail}` : "Не удалось сформировать XML.");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `esf-${data.sectionA.accountingSystemNumber || "1"}.xml`;
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

  async function handleSaveDraft() {
    if (!user) return;
    setIsSavingDraft(true);
    setMessage(null);
    try {
      await maybeSaveCounterparty();
      const built = buildData();
      const xml = generateEsfXml(built);
      await saveEsfDraft(user.id, built, buyerEmail, xml);
      setMessage("Черновик сохранён");
    } catch (error) {
      console.error("Не удалось сохранить черновик", error);
      setMessage("Не удалось сохранить черновик");
    } finally {
      setIsSavingDraft(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Раздел A. Общий раздел */}
      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader>
          <CardTitle>Документ</CardTitle>
          <CardDescription>Раздел A</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-sm text-text-muted">Номер учётной системы</Label>
            <Input
              value={data.sectionA.accountingSystemNumber}
              onChange={(e) => setData((p) => ({ ...p, sectionA: { ...p.sectionA, accountingSystemNumber: e.target.value } }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-text-muted">Дата выписки</Label>
            <Input
              type="date"
              value={data.sectionA.issueDate}
              onChange={(e) => setData((p) => ({ ...p, sectionA: { ...p.sectionA, issueDate: e.target.value } }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-text-muted">Дата совершения оборота</Label>
            <Input
              type="date"
              value={data.sectionA.turnoverDate}
              onChange={(e) => setData((p) => ({ ...p, sectionA: { ...p.sectionA, turnoverDate: e.target.value } }))}
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 sm:col-span-3">
            <Label className="text-sm">Исправленный ЭСФ</Label>
            <Switch
              checked={data.sectionA.isCorrected}
              onCheckedChange={(v) => setData((p) => ({ ...p, sectionA: { ...p.sectionA, isCorrected: v } }))}
            />
          </div>
          {data.sectionA.isCorrected ? (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">Дата</Label>
                <Input
                  type="date"
                  value={data.sectionA.correctedDate}
                  onChange={(e) => setData((p) => ({ ...p, sectionA: { ...p.sectionA, correctedDate: e.target.value } }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">Номер учётной системы</Label>
                <Input
                  value={data.sectionA.correctedSystemNumber}
                  onChange={(e) => setData((p) => ({ ...p, sectionA: { ...p.sectionA, correctedSystemNumber: e.target.value } }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">Регистрационный номер исправляемого ЭСФ</Label>
                <Input
                  value={data.sectionA.correctedRegistrationNumber}
                  onChange={(e) => setData((p) => ({ ...p, sectionA: { ...p.sectionA, correctedRegistrationNumber: e.target.value } }))}
                />
              </div>
            </>
          ) : null}

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 sm:col-span-3">
            <Label className="text-sm">Дополнительный ЭСФ</Label>
            <Switch
              checked={data.sectionA.isAdditional}
              onCheckedChange={(v) => setData((p) => ({ ...p, sectionA: { ...p.sectionA, isAdditional: v } }))}
            />
          </div>
          {data.sectionA.isAdditional ? (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">Дата</Label>
                <Input
                  type="date"
                  value={data.sectionA.additionalDate}
                  onChange={(e) => setData((p) => ({ ...p, sectionA: { ...p.sectionA, additionalDate: e.target.value } }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">Номер учётной системы</Label>
                <Input
                  value={data.sectionA.additionalSystemNumber}
                  onChange={(e) => setData((p) => ({ ...p, sectionA: { ...p.sectionA, additionalSystemNumber: e.target.value } }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">Регистрационный номер основного ЭСФ</Label>
                <Input
                  value={data.sectionA.additionalRegistrationNumber}
                  onChange={(e) => setData((p) => ({ ...p, sectionA: { ...p.sectionA, additionalRegistrationNumber: e.target.value } }))}
                />
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Раздел B + B1. Поставщик */}
      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Поставщик</CardTitle>
            <CardDescription>Раздел B / B1 — основные реквизиты из вашего профиля</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/documents/requisites">Изменить реквизиты</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-text-muted">Название</p>
              <p className="text-sm text-text">{requisites.companyName || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">БИН/ИИН</p>
              <p className="font-tabular text-sm text-text">{requisites.binIin || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Адрес</p>
              <p className="text-sm text-text">{requisites.address || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">КБе</p>
              <p className="font-tabular text-sm text-text">{requisites.kbe || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">ИИК</p>
              <p className="font-tabular text-sm text-text">{requisites.iik || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">БИК / Банк</p>
              <p className="text-sm text-text">
                {requisites.bik || "—"} {requisites.bankName ? `· ${requisites.bankName}` : ""}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Категория поставщика</Label>
              <Select
                value={data.sectionB.category}
                onValueChange={(v) => setData((p) => ({ ...p, sectionB: { ...p.sectionB, category: v } }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Не выбрано" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPLIER_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Доля участия</Label>
              <Input
                value={data.sectionB.participationShare}
                onChange={(e) => setData((p) => ({ ...p, sectionB: { ...p.sectionB, participationShare: e.target.value } }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Свидетельство плательщика НДС — серия</Label>
              <Input
                value={data.sectionB.vatCertificateSeries}
                onChange={(e) => setData((p) => ({ ...p, sectionB: { ...p.sectionB, vatCertificateSeries: e.target.value } }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Свидетельство плательщика НДС — номер</Label>
              <Input
                value={data.sectionB.vatCertificateNumber}
                onChange={(e) => setData((p) => ({ ...p, sectionB: { ...p.sectionB, vatCertificateNumber: e.target.value } }))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-sm text-text-muted">Дополнительные сведения</Label>
              <Input
                value={data.sectionB.additionalInfo}
                onChange={(e) => setData((p) => ({ ...p, sectionB: { ...p.sectionB, additionalInfo: e.target.value } }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Раздел C + C1. Покупатель */}
      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader>
          <CardTitle>Покупатель</CardTitle>
          <CardDescription>Раздел C{data.sectionC.category === "E" ? " / C1" : ""}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative space-y-1.5">
            <Label htmlFor={buyerBinId} className="text-sm text-text-muted">
              БИН/ИИН покупателя
            </Label>
            <Input
              id={buyerBinId}
              value={data.sectionC.binIin}
              onChange={(e) => setData((p) => ({ ...p, sectionC: { ...p.sectionC, binIin: e.target.value } }))}
              className="font-tabular"
              placeholder="Начните вводить — покажем сохранённых контрагентов"
            />
            {suggestions.length > 0 ? (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-border bg-white shadow-soft">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => applySuggestion(s)}
                    className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-surface-tint"
                  >
                    <span className="font-tabular text-text">{s.binIin}</span>
                    <span className="text-xs text-text-muted">{s.name}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={buyerNameId} className="text-sm text-text-muted">
              Наименование
            </Label>
            <Input
              id={buyerNameId}
              value={data.sectionC.name}
              onChange={(e) => setData((p) => ({ ...p, sectionC: { ...p.sectionC, name: e.target.value } }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={buyerAddressId} className="text-sm text-text-muted">
              Адрес
            </Label>
            <Input
              id={buyerAddressId}
              value={data.sectionC.address}
              onChange={(e) => setData((p) => ({ ...p, sectionC: { ...p.sectionC, address: e.target.value } }))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Код страны</Label>
              <Input
                value={data.sectionC.countryCode}
                onChange={(e) => setData((p) => ({ ...p, sectionC: { ...p.sectionC, countryCode: e.target.value } }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Категория получателя</Label>
              <Select
                value={data.sectionC.category}
                onValueChange={(v) =>
                  setData((p) => ({
                    ...p,
                    sectionC: { ...p.sectionC, category: v },
                    sectionC1: v === "E" ? p.sectionC1 ?? { iik: "", productCode: "", paymentPurpose: "", bik: "" } : null,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Не выбрано" />
                </SelectTrigger>
                <SelectContent>
                  {BUYER_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {data.sectionC1 ? (
            <div className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-2">
              <p className="text-sm font-medium text-text sm:col-span-2">Раздел C1 — государственное учреждение</p>
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">ИИК</Label>
                <Input
                  value={data.sectionC1.iik}
                  onChange={(e) => setData((p) => ({ ...p, sectionC1: p.sectionC1 && { ...p.sectionC1, iik: e.target.value } }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">БИК</Label>
                <Input
                  value={data.sectionC1.bik}
                  onChange={(e) => setData((p) => ({ ...p, sectionC1: p.sectionC1 && { ...p.sectionC1, bik: e.target.value } }))}
                  placeholder="KKMFKZ2A"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">Код товара, работ, услуг</Label>
                <Input
                  value={data.sectionC1.productCode}
                  onChange={(e) => setData((p) => ({ ...p, sectionC1: p.sectionC1 && { ...p.sectionC1, productCode: e.target.value } }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">Назначение платежа</Label>
                <Input
                  value={data.sectionC1.paymentPurpose}
                  onChange={(e) => setData((p) => ({ ...p, sectionC1: p.sectionC1 && { ...p.sectionC1, paymentPurpose: e.target.value } }))}
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor={buyerEmailId} className="text-sm text-text-muted">
              Email (для уведомления)
            </Label>
            <Input id={buyerEmailId} type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="save-buyer"
              type="checkbox"
              checked={saveBuyer}
              onChange={(e) => setSaveBuyer(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary accent-primary"
            />
            <Label htmlFor="save-buyer" className="text-sm text-text-muted">
              Сохранить контрагента
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Раздел D. Грузоотправитель и грузополучатель */}
      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader>
          <CardTitle>Грузоотправитель и грузополучатель</CardTitle>
          <CardDescription>Раздел D</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
            <Label className="text-sm">Грузоотправитель совпадает с поставщиком</Label>
            <Switch checked={shipperSameAsSeller} onCheckedChange={setShipperSameAsSeller} />
          </div>
          {!shipperSameAsSeller ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                placeholder="БИН/ИИН"
                value={data.sectionD.shipperBinIin}
                onChange={(e) => setData((p) => ({ ...p, sectionD: { ...p.sectionD, shipperBinIin: e.target.value } }))}
              />
              <Input
                placeholder="Наименование"
                value={data.sectionD.shipperName}
                onChange={(e) => setData((p) => ({ ...p, sectionD: { ...p.sectionD, shipperName: e.target.value } }))}
              />
              <Input
                placeholder="Адрес отправки"
                value={data.sectionD.shipperAddress}
                onChange={(e) => setData((p) => ({ ...p, sectionD: { ...p.sectionD, shipperAddress: e.target.value } }))}
              />
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
            <Label className="text-sm">Грузополучатель совпадает с покупателем</Label>
            <Switch checked={consigneeSameAsBuyer} onCheckedChange={setConsigneeSameAsBuyer} />
          </div>
          {!consigneeSameAsBuyer ? (
            <div className="grid gap-3 sm:grid-cols-4">
              <Input
                placeholder="БИН/ИИН"
                value={data.sectionD.consigneeBinIin}
                onChange={(e) => setData((p) => ({ ...p, sectionD: { ...p.sectionD, consigneeBinIin: e.target.value } }))}
              />
              <Input
                placeholder="Наименование"
                value={data.sectionD.consigneeName}
                onChange={(e) => setData((p) => ({ ...p, sectionD: { ...p.sectionD, consigneeName: e.target.value } }))}
              />
              <Input
                placeholder="Адрес доставки"
                value={data.sectionD.consigneeAddress}
                onChange={(e) => setData((p) => ({ ...p, sectionD: { ...p.sectionD, consigneeAddress: e.target.value } }))}
              />
              <Input
                placeholder="Код страны"
                value={data.sectionD.consigneeCountryCode}
                onChange={(e) => setData((p) => ({ ...p, sectionD: { ...p.sectionD, consigneeCountryCode: e.target.value } }))}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Раздел E. Условия поставки */}
      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader>
          <CardTitle>Условия поставки</CardTitle>
          <CardDescription>Раздел E</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
            <Label className="text-sm">Поставка по договору (контракту)</Label>
            <Switch
              checked={data.sectionE.hasContract}
              onCheckedChange={(v) =>
                setData((p) => ({ ...p, sectionE: { ...p.sectionE, hasContract: v, noContract: !v } }))
              }
            />
          </div>
          {data.sectionE.hasContract ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                placeholder="Номер договора"
                value={data.sectionE.contractNumber}
                onChange={(e) => setData((p) => ({ ...p, sectionE: { ...p.sectionE, contractNumber: e.target.value } }))}
              />
              <Input
                type="date"
                value={data.sectionE.contractDate}
                onChange={(e) => setData((p) => ({ ...p, sectionE: { ...p.sectionE, contractDate: e.target.value } }))}
              />
              <Input
                placeholder="Учётный номер"
                value={data.sectionE.contractAccountingNumber}
                onChange={(e) => setData((p) => ({ ...p, sectionE: { ...p.sectionE, contractAccountingNumber: e.target.value } }))}
              />
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Условия оплаты по договору</Label>
              <Input
                value={data.sectionE.paymentTerms}
                onChange={(e) => setData((p) => ({ ...p, sectionE: { ...p.sectionE, paymentTerms: e.target.value } }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Способ отправления (код)</Label>
              <Input
                value={data.sectionE.dispatchMethod}
                onChange={(e) => setData((p) => ({ ...p, sectionE: { ...p.sectionE, dispatchMethod: e.target.value } }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Доверенность — номер</Label>
              <Input
                value={data.sectionE.poaNumber}
                onChange={(e) => setData((p) => ({ ...p, sectionE: { ...p.sectionE, poaNumber: e.target.value } }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Доверенность — дата</Label>
              <Input
                type="date"
                value={data.sectionE.poaDate}
                onChange={(e) => setData((p) => ({ ...p, sectionE: { ...p.sectionE, poaDate: e.target.value } }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Пункт назначения</Label>
              <Input
                value={data.sectionE.destination}
                onChange={(e) => setData((p) => ({ ...p, sectionE: { ...p.sectionE, destination: e.target.value } }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Условия поставки</Label>
              <Input
                value={data.sectionE.deliveryTerms}
                onChange={(e) => setData((p) => ({ ...p, sectionE: { ...p.sectionE, deliveryTerms: e.target.value } }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Раздел F. Документ, подтверждающий поставку */}
      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader>
          <CardTitle>Документ, подтверждающий поставку</CardTitle>
          <CardDescription>Раздел F</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-sm text-text-muted">Номер</Label>
            <Input
              value={data.sectionF.documentNumber}
              onChange={(e) => setData((p) => ({ ...p, sectionF: { ...p.sectionF, documentNumber: e.target.value } }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-text-muted">Дата</Label>
            <Input
              type="date"
              value={data.sectionF.documentDate}
              onChange={(e) => setData((p) => ({ ...p, sectionF: { ...p.sectionF, documentDate: e.target.value } }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-text-muted">Код валюты</Label>
            <Input
              value={data.sectionF.currencyCode}
              onChange={(e) => setData((p) => ({ ...p, sectionF: { ...p.sectionF, currencyCode: e.target.value } }))}
            />
          </div>
          {data.sectionF.currencyCode !== "KZT" ? (
            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Курс валюты</Label>
              <Input
                value={data.sectionF.currencyRate}
                onChange={(e) => setData((p) => ({ ...p, sectionF: { ...p.sectionF, currencyRate: e.target.value } }))}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Раздел G. Товары/услуги */}
      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader>
          <CardTitle>Товары/услуги</CardTitle>
          <CardDescription>Раздел G — стрелка раскрывает дополнительные поля строки</CardDescription>
        </CardHeader>
        <CardContent>
          <EsfItemsTable items={data.items} onChange={(items) => setData((p) => ({ ...p, items }))} />
        </CardContent>
      </Card>

      {/* Итоги */}
      <Card className="rounded-2xl border-border shadow-soft">
        <CardContent className="grid gap-3 py-6 sm:grid-cols-4">
          <div>
            <p className="text-sm text-text-muted">Без налогов</p>
            <p className="font-tabular text-lg font-semibold text-text">{formatTenge(totals.totalSum)}</p>
          </div>
          <div>
            <p className="text-sm text-text-muted">Акциз</p>
            <p className="font-tabular text-lg font-semibold text-text">{formatTenge(totals.totalExcise)}</p>
          </div>
          <div>
            <p className="text-sm text-text-muted">НДС</p>
            <p className="font-tabular text-lg font-semibold text-text">{formatTenge(totals.totalVat)}</p>
          </div>
          <div>
            <p className="text-sm text-text-muted">ИТОГО</p>
            <p className="font-tabular text-2xl font-bold text-primary">{formatTenge(totals.totalSumWithTax)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Раздел H. Совместная деятельность */}
      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Участники совместной деятельности</CardTitle>
            <CardDescription>Раздел H — заполняется редко</CardDescription>
          </div>
          <Switch checked={showJointVenture} onCheckedChange={setShowJointVenture} />
        </CardHeader>
        {showJointVenture ? (
          <CardContent>
            <EsfItemsTable items={data.jointVentureItems} onChange={(items) => setData((p) => ({ ...p, jointVentureItems: items }))} />
          </CardContent>
        ) : null}
      </Card>

      {/* Раздел I / J. Поверенные */}
      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader>
          <CardTitle>Поверенные (операторы)</CardTitle>
          <CardDescription>Разделы I / J — заполняются редко</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
            <Label className="text-sm">Указать поверенного поставщика</Label>
            <Switch
              checked={showSupplierAgent}
              onCheckedChange={(v) => {
                setShowSupplierAgent(v);
                setData((p) => ({ ...p, supplierAgent: v ? p.supplierAgent ?? { bin: "", name: "", address: "", documentNumber: "", documentDate: "" } : null }));
              }}
            />
          </div>
          {showSupplierAgent && data.supplierAgent ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="БИН"
                value={data.supplierAgent.bin}
                onChange={(e) => setData((p) => ({ ...p, supplierAgent: p.supplierAgent && { ...p.supplierAgent, bin: e.target.value } }))}
              />
              <Input
                placeholder="Поверенный"
                value={data.supplierAgent.name}
                onChange={(e) => setData((p) => ({ ...p, supplierAgent: p.supplierAgent && { ...p.supplierAgent, name: e.target.value } }))}
              />
              <Input
                placeholder="Адрес"
                value={data.supplierAgent.address}
                onChange={(e) => setData((p) => ({ ...p, supplierAgent: p.supplierAgent && { ...p.supplierAgent, address: e.target.value } }))}
              />
              <div className="flex gap-3">
                <Input
                  placeholder="Номер документа"
                  value={data.supplierAgent.documentNumber}
                  onChange={(e) => setData((p) => ({ ...p, supplierAgent: p.supplierAgent && { ...p.supplierAgent, documentNumber: e.target.value } }))}
                />
                <Input
                  type="date"
                  value={data.supplierAgent.documentDate}
                  onChange={(e) => setData((p) => ({ ...p, supplierAgent: p.supplierAgent && { ...p.supplierAgent, documentDate: e.target.value } }))}
                />
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
            <Label className="text-sm">Указать поверенного покупателя</Label>
            <Switch
              checked={showBuyerAgent}
              onCheckedChange={(v) => {
                setShowBuyerAgent(v);
                setData((p) => ({ ...p, buyerAgent: v ? p.buyerAgent ?? { bin: "", name: "", address: "", documentNumber: "", documentDate: "" } : null }));
              }}
            />
          </div>
          {showBuyerAgent && data.buyerAgent ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="БИН"
                value={data.buyerAgent.bin}
                onChange={(e) => setData((p) => ({ ...p, buyerAgent: p.buyerAgent && { ...p.buyerAgent, bin: e.target.value } }))}
              />
              <Input
                placeholder="Поверенный"
                value={data.buyerAgent.name}
                onChange={(e) => setData((p) => ({ ...p, buyerAgent: p.buyerAgent && { ...p.buyerAgent, name: e.target.value } }))}
              />
              <Input
                placeholder="Адрес"
                value={data.buyerAgent.address}
                onChange={(e) => setData((p) => ({ ...p, buyerAgent: p.buyerAgent && { ...p.buyerAgent, address: e.target.value } }))}
              />
              <div className="flex gap-3">
                <Input
                  placeholder="Номер документа"
                  value={data.buyerAgent.documentNumber}
                  onChange={(e) => setData((p) => ({ ...p, buyerAgent: p.buyerAgent && { ...p.buyerAgent, documentNumber: e.target.value } }))}
                />
                <Input
                  type="date"
                  value={data.buyerAgent.documentDate}
                  onChange={(e) => setData((p) => ({ ...p, buyerAgent: p.buyerAgent && { ...p.buyerAgent, documentDate: e.target.value } }))}
                />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Раздел K / L */}
      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader>
          <CardTitle>Дополнительные сведения и подпись</CardTitle>
          <CardDescription>Разделы K, L</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-text-muted">Дополнительные сведения</Label>
            <Textarea
              rows={2}
              value={data.additionalInfo}
              onChange={(e) => setData((p) => ({ ...p, additionalInfo: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-text-muted">Ф.И.О. лица, выписывающего ЭСФ</Label>
            <Input
              value={data.issuedByFullName}
              onChange={(e) => setData((p) => ({ ...p, issuedByFullName: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
        <div>
          <Label htmlFor="test-mode" className="text-sm">
            Тестовый режим
          </Label>
          <p className="text-xs text-text-muted">Отправка на тестовый стенд ИС ЭСФ вместо прода</p>
        </div>
        <Switch id="test-mode" checked={testMode} onCheckedChange={toggleTestMode} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" className="gap-2" onClick={handleDownloadXml} disabled={isDownloading}>
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Скачать XML
        </Button>

        <SignAndSendButton esfData={buildData()} testMode={testMode} />

        <Button type="button" variant="outline" className="gap-2" onClick={handleSaveDraft} disabled={isSavingDraft}>
          {isSavingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Сохранить черновик
        </Button>

        {message ? <span className="text-sm text-text-muted">{message}</span> : null}
      </div>
    </div>
  );
}
