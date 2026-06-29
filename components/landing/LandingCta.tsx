import Link from "next/link";
import { ArrowRight, Banknote, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingCta() {
  return (
    <section className="py-24">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-14 text-center sm:px-16">
          <span className="absolute -left-2 top-8 hidden h-14 w-14 animate-float items-center justify-center rounded-2xl bg-white/15 text-white sm:flex">
            <Banknote className="h-6 w-6" />
          </span>
          <span className="absolute right-4 bottom-8 hidden h-14 w-14 animate-float-delayed items-center justify-center rounded-2xl bg-white/15 text-white sm:flex">
            <FileSpreadsheet className="h-6 w-6" />
          </span>

          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Готовы посчитать налоги за 30 секунд?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-bg/90">
            Без регистрации, без банковской карты — просто откройте калькулятор и введите свои цифры.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="gap-2 rounded-xl bg-white px-8 py-6 text-base text-primary hover:bg-primary-bg"
            >
              <Link href="/calculators">
                Попробовать бесплатно
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-xl border-white/40 bg-transparent px-8 py-6 text-base text-white hover:bg-white/10"
            >
              <Link href="/register">Создать аккаунт</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
