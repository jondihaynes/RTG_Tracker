import HomePageClient from "@/components/home-page-client";
import { createSiteConfig } from "@/lib/site-config";

export default function Home() {
  const config = createSiteConfig();

  return <HomePageClient config={config} />;
}
