import { verifySession } from "@/lib/dal";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function HomePage() {
  const session = await verifySession("/home");
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold" data-testid="home-heading">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-muted">Signed in as {session.email}. The rest of the site is being built loop by loop.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Mentor", "Ask a senior student who has done the process."],
          ["Technicals", "The textbook for IB technicals that doesn't exist yet."],
          ["Practice", "Question bank and spaced-repetition flashcards."],
          ["Interviews", "AI mock interviews graded against model answers."],
        ].map(([title, desc]) => (
          <Card key={title} className="opacity-70">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{desc}</CardDescription>
          </Card>
        ))}
      </div>
    </>
  );
}
