import path from "node:path";
import { createElement } from "react";
import { Font, Document, Page, Text, renderToBuffer } from "@react-pdf/renderer";

export const PDF_FONT_FAMILY = "Arimo";

const fontsDir = path.join(process.cwd(), "public", "fonts");

// Arimo — open-лицензионный шрифт, метрически и визуально совместимый с Arial
// (как у 1С/МоегоСклада), но без ограничений на распространение файлов Arial.
// Регистрация в одном модуле — InvoiceDocument и ReportDocument импортируют
// его только за побочный эффект, чтобы не регистрировать шрифт дважды.
Font.register({
  family: PDF_FONT_FAMILY,
  fonts: [
    { src: path.join(fontsDir, "Arimo-Regular.ttf"), fontWeight: "normal" },
    { src: path.join(fontsDir, "Arimo-Bold.ttf"), fontWeight: "bold" },
  ],
});

const WARMUP_CHARS =
  "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя" +
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

let warmupPromise: Promise<void> | null = null;

/**
 * @react-pdf/font эмпирически теряет/портит отдельные буквы при ПЕРВОМ
 * использовании конкретного глифа в процессе (похоже на состояние гонки в
 * сборке подмножества шрифта при рендере) — воспроизведено многократно на
 * латинских буквах (особенно заглавных), не зависело от конкретной буквы.
 * Один полный прогон через все буквы кириллицы и латиницы, оба начертания,
 * до первого реального документа надёжно устраняет эффект. Каждый роут,
 * генерирующий PDF, должен await эту функцию перед renderToBuffer().
 */
export function ensureFontWarmedUp(): Promise<void> {
  if (!warmupPromise) {
    const doc = createElement(
      Document,
      null,
      createElement(
        Page,
        { style: { fontFamily: PDF_FONT_FAMILY } },
        createElement(Text, { style: { fontWeight: "normal" } }, WARMUP_CHARS),
        createElement(Text, { style: { fontWeight: "bold" } }, WARMUP_CHARS)
      )
    );
    warmupPromise = renderToBuffer(doc as never).then(() => undefined);
  }
  return warmupPromise;
}
