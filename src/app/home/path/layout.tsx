import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "10-week path — A* Apply",
  robots: { index: false, follow: false },
};

export default function PathLayout({ children }: LayoutProps<"/home/path">) {
  return <div className="flex flex-col gap-6">{children}</div>;
}
