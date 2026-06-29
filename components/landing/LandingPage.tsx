import { Inter } from "next/font/google";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingAudience } from "@/components/landing/LandingAudience";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingCta } from "@/components/landing/LandingCta";
import { LandingFooter } from "@/components/landing/LandingFooter";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export function LandingPage() {
  return (
    <div className={`${inter.className} flex min-h-full flex-1 flex-col bg-background`}>
      <LandingNavbar />
      <LandingHero />
      <LandingHowItWorks />
      <LandingFeatures />
      <LandingAudience />
      <LandingPricing />
      <LandingFaq />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
