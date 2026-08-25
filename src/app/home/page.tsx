import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "A* Apply — Home",
  robots: { index: false, follow: false },
};

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col bg-black font-sans text-zinc-100">
      <header className="flex items-center gap-4 border-b border-zinc-800 px-6 py-4">
        <Image src="/logo.png" alt="A* Apply" width={120} height={120} className="h-auto w-24" />
      </header>
      <main className="flex flex-1 flex-col gap-4 px-6 py-10">
        <h1 className="text-2xl font-semibold">Home</h1>
        <p className="text-zinc-400">
          Private area — only people with the access key can see this. Build the real
          site here while the public page stays on &ldquo;Coming soon&rdquo;.
        </p>
      </main>
    </div>
  );
}
