import path from "node:path";
import { Font } from "@react-pdf/renderer";

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
