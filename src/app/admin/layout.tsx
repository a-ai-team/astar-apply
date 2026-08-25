import type { Metadata } from "next";
import { verifyStaff } from "@/lib/dal";
import { AppShell, ADMIN_NAV } from "@/components/shell/app-shell";

export const metadata: Metadata = {
  title: "Admin — A* Apply",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await verifyStaff();
  return (
    <AppShell session={session} nav={ADMIN_NAV}>
      {children}
    </AppShell>
  );
}
