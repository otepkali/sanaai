import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Шрифт Arimo и логотип живут в public/, но рендер PDF идёт в серверлес-функции —
  // без этого Vercel может не включить эти файлы в трассировку для /api/invoice и /api/report.
  outputFileTracingIncludes: {
    "/api/invoice": ["./public/fonts/**/*"],
    "/api/report": ["./public/fonts/**/*", "./public/logo.png"],
  },
};

export default nextConfig;
