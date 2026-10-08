// Reading column for chapter pages, lessons and cheat sheets: centred and capped so prose runs at a
// comfortable line length on wide screens (the shell itself allows max-w-6xl for grids).
export default function TopicLayout({ children }: LayoutProps<"/home/technicals/[topic]">) {
  return <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 print:max-w-none">{children}</div>;
}
