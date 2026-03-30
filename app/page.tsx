import { LandingPage } from "@/features/public/landing-page";
import { getPublicHighlights } from "@/lib/services/staffbook-service";

export default async function HomePage() {
  const data = await getPublicHighlights();
  return <LandingPage data={data} />;
}
