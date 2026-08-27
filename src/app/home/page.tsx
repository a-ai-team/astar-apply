import { verifySession } from "@/lib/dal";
import { Closing, Hero, HowItWorks, Mentors, Suite, Thesis } from "@/components/home/sections";

// Marks the landing wrapper as JS-driven before first paint so `[data-js] [data-reveal]` can hide
// content for the scroll reveals; without JS everything simply renders visible.
const MARK_JS = "document.currentScript.parentElement.setAttribute('data-js','')";

export default async function HomePage() {
  await verifySession("/home");
  return (
    <div className="-mx-4 -my-8 flex flex-col md:-mx-8" data-testid="home-landing" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: MARK_JS }} />
      <Hero />
      <Thesis />
      <HowItWorks />
      <Mentors />
      <Suite />
      <Closing />
    </div>
  );
}
