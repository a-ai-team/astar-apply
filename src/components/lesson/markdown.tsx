// Markdown → React for lesson/question bodies: GFM tables + KaTeX maths ($…$ / $$…$$).
// Server-renderable (react-markdown has no hooks) and also fine inside client components.
// KaTeX CSS is imported by LessonRenderer so it only ships on lesson routes.
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/cn";

const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeKatex];

export function Markdown({ md, className }: { md: string; className?: string }) {
  return (
    <div className={cn("prose-lesson", className)}>
      <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
        {md}
      </ReactMarkdown>
    </div>
  );
}
