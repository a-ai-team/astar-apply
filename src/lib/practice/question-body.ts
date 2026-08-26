// Parser for `questions.body` as stored (row keys live in columns). Reuses the contract schema so
// the renderer never trusts the DB shape blindly; a malformed body → 404 rather than a crash.
import { QuestionSchema } from "@/lib/content/question-schema";

export const QuestionBodySchemaLoose = QuestionSchema.pick({
  model_answer_md: true,
  key_points: true,
  follow_ups: true,
  weak_answer_note: true,
  numbers: true,
  flashcard_back: true,
});
