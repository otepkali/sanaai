"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Send, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { NCALayerClient } from "@/lib/esf/ncalayer";
import { generateEsfXml, type EsfData } from "@/lib/esf/generate-xml";

type Step = "idle" | "connecting" | "signing" | "sending" | "success" | "error";

const STEP_LABELS: Record<Step, string> = {
  idle: "",
  connecting: "Подключение к NCALayer…",
  signing: "Ожидание подписи в NCALayer…",
  sending: "Отправка в ИС ЭСФ…",
  success: "Готово",
  error: "Ошибка",
};

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function SignAndSendButton({ esfData, testMode }: { esfData: EsfData; testMode: boolean }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve().then(() => setIsMobile(isMobileDevice()));
  }, []);

  async function handleConfirm() {
    const client = new NCALayerClient();
    try {
      setStep("connecting");
      setMessage(null);
      await client.connect();

      setStep("signing");
      const xml = generateEsfXml(esfData);
      const signedXml = await client.signXml(xml);

      setStep("sending");
      const response = await fetch("/api/esf/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedXml, esfData, testMode }),
      });
      const result = await response.json();

      if (result.success) {
        setStep("success");
        setMessage(`ЭСФ №${esfData.sectionA.accountingSystemNumber} успешно отправлен в ИС ЭСФ`);
      } else {
        setStep("error");
        setMessage(result.error || "Не удалось отправить ЭСФ");
      }
    } catch (error) {
      setStep("error");
      const description = error instanceof Error ? error.message : "неизвестная ошибка";
      setMessage(
        description.includes("NCALayer")
          ? `${description}\n\nИли используйте «Скачать XML» для ручной загрузки на esf.gov.kz`
          : description
      );
    } finally {
      client.disconnect();
    }
  }

  function handleOpenChange(open: boolean) {
    setIsDialogOpen(open);
    if (!open) {
      setStep("idle");
      setMessage(null);
    }
  }

  if (isMobile) {
    return (
      <p className="rounded-xl border border-border bg-surface-tint p-3 text-sm text-text-muted">
        Для подписи через NCALayer используйте компьютер. На мобильном доступно только скачивание XML.
      </p>
    );
  }

  return (
    <>
      <Button type="button" variant="outline" className="gap-2" onClick={() => setIsDialogOpen(true)}>
        <Send className="h-4 w-4" />
        Подписать и отправить через NCALayer
      </Button>

      <AlertDialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отправка ЭСФ через NCALayer</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                {step === "idle" ? (
                  <ol className="list-decimal space-y-1 pl-4 text-sm">
                    <li>Убедитесь, что NCALayer запущен на вашем компьютере</li>
                    <li>
                      Если не установлен — скачайте на{" "}
                      <a href="https://pki.gov.kz/ncalayer/" target="_blank" rel="noreferrer" className="text-primary underline">
                        pki.gov.kz/ncalayer
                      </a>
                    </li>
                    <li>Нажмите «Подключить и подписать»</li>
                  </ol>
                ) : (
                  <div className="space-y-3">
                    {(["connecting", "signing", "sending"] as Step[]).map((s) => {
                      const order: Step[] = ["connecting", "signing", "sending"];
                      const currentIndex = order.indexOf(step);
                      const stepIndex = order.indexOf(s);
                      const isDone = step === "success" || (currentIndex > stepIndex && currentIndex !== -1);
                      const isActive = step === s;
                      return (
                        <div key={s} className="flex items-center gap-2 text-sm">
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                          ) : isActive ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                          ) : (
                            <span className="h-4 w-4 shrink-0 rounded-full border border-border" />
                          )}
                          <span className={isActive ? "text-text" : "text-text-muted"}>{STEP_LABELS[s]}</span>
                        </div>
                      );
                    })}

                    {step === "success" ? (
                      <div className="flex items-center gap-2 text-sm text-success">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        {message}
                      </div>
                    ) : null}

                    {step === "error" ? (
                      <div className="flex items-start gap-2 whitespace-pre-line text-sm text-danger">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        {message}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{step === "success" || step === "error" ? "Закрыть" : "Отмена"}</AlertDialogCancel>
            {step === "idle" ? (
              <Button onClick={handleConfirm} className="gap-2">
                Подключить и подписать
              </Button>
            ) : null}
            {step === "error" ? (
              <Button onClick={() => setStep("idle")} className="gap-2">
                Повторить
              </Button>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
