import { redirect } from "next/navigation";

// The site lives at /home (docs/PRIVATE_AREA.md). Visitors without the team key are sent on to
// /unlock by src/proxy.ts. Temporary (307) on purpose: `/` becomes the public landing at launch.
export default function Root() {
  redirect("/home");
}
