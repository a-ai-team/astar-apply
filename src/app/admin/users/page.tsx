import { verifyStaff } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";

type Row = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: "student" | "mentor" | "admin";
  university: string | null;
  created_at: string;
  last_sign_in_at: string | null;
};

async function listUsers(): Promise<Row[]> {
  // Service-role client: RLS would hide other users' profiles from mentors. Safe because the
  // layout already verified a staff session, and this page is read-only.
  const admin = createAdminClient();
  const [{ data: profiles, error }, { data: authUsers, error: authError }] = await Promise.all([
    admin.from("profiles").select("id, display_name, role, university, created_at").order("created_at", { ascending: false }).limit(200),
    admin.auth.admin.listUsers({ perPage: 200 }),
  ]);
  if (error) throw error;
  if (authError) throw authError;
  const byId = new Map(authUsers.users.map((u) => [u.id, u]));
  return (profiles ?? []).map((p) => ({
    ...p,
    email: byId.get(p.id)?.email ?? null,
    last_sign_in_at: byId.get(p.id)?.last_sign_in_at ?? null,
  }));
}

function fmt(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

export default async function AdminUsersPage() {
  await verifyStaff();
  const users = await listUsers();
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-muted">{users.length} accounts. Read-only for now; change roles in Supabase → Table editor → profiles.</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm" data-testid="users-table">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">University</th>
              <th className="px-4 py-2">Joined</th>
              <th className="px-4 py-2">Last sign-in</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-2 font-mono text-xs">{u.email ?? u.id}</td>
                <td className="px-4 py-2">{u.display_name ?? "—"}</td>
                <td className="px-4 py-2">
                  <Badge tone={u.role === "student" ? "neutral" : "accent"}>{u.role}</Badge>
                </td>
                <td className="px-4 py-2">{u.university ?? "—"}</td>
                <td className="px-4 py-2 text-muted">{fmt(u.created_at)}</td>
                <td className="px-4 py-2 text-muted">{fmt(u.last_sign_in_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
