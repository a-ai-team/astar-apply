"use client";

// ⌘K / Ctrl+K palette over approved lessons + questions (server action `searchContent` → RLS).
// Mounted once in the /home layout. cmdk does the list/keyboard handling; filtering is server-side
// (`shouldFilter={false}`) so results match the FTS ranking.
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { searchContent } from "@/app/home/practice/actions";
import { buildSearchQuery, searchHitHref, type SearchHit } from "@/lib/practice/search";
import { Badge } from "@/components/ui/badge";

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      if (!buildSearchQuery(q)) setHits([]);
      else startTransition(async () => setHits(await searchContent(q)));
    }, 180);
    return () => clearTimeout(id);
  }, [q, open]);

  function go(hit: SearchHit) {
    setOpen(false);
    setQ("");
    router.push(searchHitHref(hit));
  }

  const questions = hits.filter((h) => h.kind === "question");
  const lessons = hits.filter((h) => h.kind === "lesson");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted hover:text-fg sm:flex"
        data-testid="palette-open"
        aria-label="Search (⌘K)"
      >
        Search <kbd className="rounded border border-border px-1">⌘K</kbd>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-[12vh]" onClick={() => setOpen(false)} data-testid="palette">
          <Command
            label="Search lessons and questions"
            shouldFilter={false}
            className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-surface text-fg shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
          >
            <Command.Input
              autoFocus
              value={q}
              onValueChange={setQ}
              placeholder="Search questions and lessons…"
              className="h-12 w-full border-b border-border bg-transparent px-4 text-sm outline-none placeholder:text-muted"
              data-testid="palette-input"
            />
            <Command.List className="max-h-80 overflow-y-auto p-2">
              {pending && <div className="px-2 py-1 text-xs text-muted">Searching…</div>}
              <Command.Empty className="px-2 py-6 text-center text-sm text-muted">
                {buildSearchQuery(q) ? "No approved content matches." : "Type at least two characters."}
              </Command.Empty>
              {questions.length > 0 && (
                <Command.Group heading="Questions" className="text-xs text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1">
                  {questions.map((h) => (
                    <Command.Item key={h.id} value={`q-${h.id}`} onSelect={() => go(h)} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-fg data-[selected=true]:bg-bg" data-testid="palette-item">
                      <span className="line-clamp-1 flex-1">{h.title}</span>
                      {h.difficulty != null && <Badge>D{h.difficulty}</Badge>}
                      <Badge>{h.topic_slug}</Badge>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
              {lessons.length > 0 && (
                <Command.Group heading="Lessons" className="text-xs text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1">
                  {lessons.map((h) => (
                    <Command.Item key={h.id} value={`l-${h.id}`} onSelect={() => go(h)} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-fg data-[selected=true]:bg-bg" data-testid="palette-item">
                      <span className="line-clamp-1 flex-1">{h.title}</span>
                      <Badge tone="accent">lesson</Badge>
                      <Badge>{h.topic_slug}</Badge>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>
          </Command>
        </div>
      )}
    </>
  );
}
