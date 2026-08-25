import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Technicals — A* Apply",
  robots: { index: false, follow: false },
};

export default function TechnicalsLayout({ children }: LayoutProps<"/home/technicals">) {
  return <div className="flex flex-col gap-6">{children}</div>;
}
