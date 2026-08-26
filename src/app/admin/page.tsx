import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold" data-testid="admin-heading">
        Admin
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/users">
          <Card className="hover:border-muted">
            <CardTitle>Users</CardTitle>
            <CardDescription>Everyone with an account, and their role.</CardDescription>
          </Card>
        </Link>
        <Link href="/admin/corpus">
          <Card className="hover:border-muted">
            <CardTitle>Corpus</CardTitle>
            <CardDescription>Mentor uploads: photos, PDFs, notes and Q&amp;A → reviewable chunks.</CardDescription>
          </Card>
        </Link>
        <Link href="/admin/feedback">
          <Card className="hover:border-muted">
            <CardTitle>Feedback</CardTitle>
            <CardDescription>Thumbs-down answers from the mentor chatbot with the chunks it retrieved.</CardDescription>
          </Card>
        </Link>
        <Link href="/admin/review">
          <Card className="hover:border-muted">
            <CardTitle>Review queue</CardTitle>
            <CardDescription>Generated lessons and questions waiting for a mentor decision.</CardDescription>
          </Card>
        </Link>
        <Link href="/admin/generation">
          <Card className="hover:border-muted">
            <CardTitle>Generation</CardTitle>
            <CardDescription>Batch runs: dry-run estimates, submitted batches, collected results.</CardDescription>
          </Card>
        </Link>
        <Link href="/admin/lessons">
          <Card className="hover:border-muted">
            <CardTitle>Lessons</CardTitle>
            <CardDescription>Curriculum lessons as JSON: validate, preview, approve.</CardDescription>
          </Card>
        </Link>
      </div>
    </>
  );
}
