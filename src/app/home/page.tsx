import { verifySession } from "@/lib/dal";
import { Closing, Hero, InTheWorks, Mentor, Path, Route, Toolkit } from "@/components/home/sections";

// Runs before first paint. Marks the landing wrapper as JS-driven so `[data-js] [data-reveal]` can
// hide content for the scroll reveals (without JS everything simply renders visible), and hides the
// header wordmark while the hero wordmark is on screen (src/components/home/hero-brand.tsx takes
// over once hydrated and clears the attribute when it unmounts).
const MARK_JS =
  "document.currentScript.parentElement.setAttribute('data-js','');" +
  "document.documentElement.setAttribute('data-hero-brand','visible')";

export default async function HomePage() {
  await verifySession("/home");
  return (
    <div className="-mx-4 -my-8 flex flex-col md:-mx-8" data-testid="home-landing" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: MARK_JS }} />
      <Hero />
      <Toolkit />
      <Route />
      <Path />
      <Mentor />
      <InTheWorks />
      <Closing />
    </div>
  );
}
