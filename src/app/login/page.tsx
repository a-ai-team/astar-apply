import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/dal";
import { safeNext } from "@/lib/site";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in — A* Apply",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const session = await getSession();
  const dest = safeNext(next);
  if (session) redirect(dest);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-bg font-sans">
      <main className="flex w-full max-w-xs flex-col items-center gap-8 px-6 py-24">
        <Image src="/logo.png" alt="A* Apply" width={220} height={85} className="h-auto w-44" priority />
        <LoginForm
          next={dest}
          initialError={error === "link" ? "That link is invalid or has expired. Request a new one." : undefined}
        />
      </main>
    </div>
  );
}
