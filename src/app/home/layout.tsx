import type { Metadata } from "next";
import { verifySession } from "@/lib/dal";
import { AppShell, HOME_NAV } from "@/components/shell/app-shell";

export const metadata: Metadata = {
  title: "A* Apply",
  robots: { index: false, follow: false },
};

export default async function HomeLayout({ children }: LayoutProps<"/home">) {
  const session = await verifySession("/home");
  return (
    <AppShell session={session} nav={HOME_NAV}>
      {children}
    </AppShell>
  );
}
