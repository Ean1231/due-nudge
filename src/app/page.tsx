import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { PricingCta, SiteFooter } from "@/components/marketing/pricing";
import { SiteHeader } from "@/components/marketing/site-header";

export default function HomePage() {
  return (
    <main>
      <SiteHeader />
      <Hero />
      <HowItWorks />
      <PricingCta />
      <SiteFooter />
    </main>
  );
}
