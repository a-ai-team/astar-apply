// "Mark complete" + "Practise this" on a lesson page (server component; forms post to actions).
import Link from "next/link";
import { completeLesson, uncompleteLesson } from "@/app/home/practice/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrackSubmit } from "@/components/analytics/track-submit";

export function LessonProgressControls({ lessonId, topicSlug, completed }: { lessonId: string; topicSlug: string; completed: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-4" data-testid="lesson-progress">
      {completed ? (
        <>
          <Badge tone="accent" data-testid="lesson-completed">Completed</Badge>
          <form action={uncompleteLesson}>
            <input type="hidden" name="lessonId" value={lessonId} />
            <Button type="submit" variant="ghost" size="sm" data-testid="lesson-uncomplete">Undo</Button>
          </form>
        </>
      ) : (
        <TrackSubmit action={completeLesson} event="lesson_complete" props={{ lesson_id: lessonId, topic: topicSlug }}>
          <input type="hidden" name="lessonId" value={lessonId} />
          <Button type="submit" size="sm" data-testid="lesson-complete">Mark complete</Button>
        </TrackSubmit>
      )}
      <div className="ml-auto flex gap-2">
        <Link href={`/home/practice?topic=${topicSlug}`} data-testid="lesson-practise">
          <Button type="button" variant="secondary" size="sm">Practise this</Button>
        </Link>
        <Link href={`/home/flashcards/${topicSlug}`} data-testid="lesson-flashcards">
          <Button type="button" variant="secondary" size="sm">Flashcards</Button>
        </Link>
      </div>
    </div>
  );
}
