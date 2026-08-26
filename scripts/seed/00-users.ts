// Seed 00 — the three e2e users (docs/loops/CONTRACTS.md) plus the `system-bot` reviewer profile
// (Loop 06: the disagreement detector files content_reviews rows as it). Idempotent: finds by
// email, creates if missing, then upserts the profile role (and a mentors row for the mentor).
import { adminClient } from "./env";

export const E2E_USERS = [
  { email: "e2e-student@astar.test", role: "student", display_name: "E2E Student" },
  { email: "e2e-mentor@astar.test", role: "mentor", display_name: "E2E Mentor" },
  { email: "e2e-admin@astar.test", role: "admin", display_name: "E2E Admin" },
  // Never signs in; exists so content_reviews.reviewer_id can point at a real profile.
  { email: "system-bot@astar.test", role: "mentor", display_name: "System bot" },
] as const;

export async function seedUsers() {
  const admin = adminClient();
  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;

  for (const u of E2E_USERS) {
    let id = list.users.find((x) => x.email === u.email)?.id;
    if (!id) {
      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        email_confirm: true,
        user_metadata: { display_name: u.display_name },
      });
      if (error) throw error;
      id = data.user.id;
      console.log(`created ${u.email}`);
    }
    const { error: profileError } = await admin
      .from("profiles")
      .upsert({ id, role: u.role, display_name: u.display_name }, { onConflict: "id" });
    if (profileError) throw profileError;
    if (u.role === "mentor" && u.email !== "system-bot@astar.test") {
      const { error: mentorError } = await admin
        .from("mentors")
        .upsert({ id, headline: "PLACEHOLDER — synthetic e2e mentor", is_public: false }, { onConflict: "id" });
      if (mentorError) throw mentorError;
    }
    console.log(`ok ${u.email} → ${u.role}`);
  }
}

if (process.argv[1]?.endsWith("00-users.ts")) {
  seedUsers().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
