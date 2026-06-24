import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Шрифт Arimo и логотип живут в public/, но рендер PDF идёт в серверлес-функции —
  // без этого Vercel может не включить эти файлы в трассировку для /api/invoice и /api/report.
  outputFileTracingIncludes: {
    "/api/invoice": ["./public/fonts/**/*"],
    "/api/report": ["./public/fonts/**/*", "./public/logo.png"],
    // pdfjs-dist подгружает pdf.worker.mjs и шрифты/cmaps по путям относительно
    // собственного node_modules — автотрассировка Vercel может их не найти.
    // @napi-rs/canvas подгружается pdfjs-dist через require() внутри try/catch —
    // автотрассировка Vercel такие условные require не видит и не копирует пакет
    // (включая нативный бинарник конкретной платформы) в собранную функцию.
    "/api/accounting/analyze": [
      "./node_modules/pdfjs-dist/legacy/build/**/*",
      "./node_modules/pdfjs-dist/cmaps/**/*",
      "./node_modules/pdfjs-dist/standard_fonts/**/*",
      "./node_modules/@napi-rs/canvas/**/*",
      "./node_modules/@napi-rs/canvas-linux-x64-gnu/**/*",
      "./node_modules/@napi-rs/canvas-linux-x64-musl/**/*",
      "./node_modules/@napi-rs/canvas-linux-arm64-gnu/**/*",
    ],
  },
  // pdfjs-dist динамически импортирует свой pdf.worker.mjs по пути относительно
  // собственного node_modules — при бандлинге через Turbopack/Webpack этот путь
  // ломается ("Setting up fake worker failed"). serverExternalPackages заставляет
  // Next.js резолвить пакет через нативный require Node вместо бандлинга.
  // @napi-rs/canvas — нативный N-API бинарник, который pdfjs-dist подхватывает
  // сам для полифилла DOMMatrix (без него в Node бросает ReferenceError).
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"],
};

export default nextConfig;
