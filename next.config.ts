import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Шрифты PT Sans живут в public/, но рендер PDF идёт в серверлес-функции —
  // без этого Vercel может не включить TTF-файлы в трассировку для /api/invoice.
  outputFileTracingIncludes: {
    "/api/invoice": ["./public/fonts/**/*"],
  },
};

export default nextConfig;
