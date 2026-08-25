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
        <Card className="opacity-60">
          <CardTitle>Corpus</CardTitle>
          <CardDescription>Mentor uploads — arrives in Loop 01.</CardDescription>
        </Card>
      </div>
    </>
  );
}
