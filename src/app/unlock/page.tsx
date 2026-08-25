import type { Metadata } from "next";
import { UnlockForm } from "./unlock-form";

export const metadata: Metadata = {
  title: "A* Apply",
  robots: { index: false, follow: false },
};

export default async function UnlockPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-black font-sans">
      <main className="flex flex-col items-center gap-6 px-8 py-24">
        <UnlockForm next={next?.startsWith("/") ? next : "/home"} />
      </main>
    </div>
  );
}
