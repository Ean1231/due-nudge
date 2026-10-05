import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/seo";
import { PLAN } from "@/lib/plan";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { PricingCta, SiteFooter } from "@/components/marketing/pricing";
import { SiteHeader } from "@/components/marketing/site-header";

export default function HomePage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: siteUrl(),
    description: SITE_DESCRIPTION,
    offers: {
      "@type": "Offer",
      price: (PLAN.amountCents / 100).toFixed(2),
      priceCurrency: "USD",
    },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <SiteHeader />
      <Hero />
      <HowItWorks />
      <PricingCta />
      <SiteFooter />
    </main>
  );
}
