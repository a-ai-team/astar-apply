import { verifySession } from "@/lib/dal";
import { ChatPanel } from "@/components/chat/chat-panel";

export default async function MentorPage() {
  await verifySession("/home/mentor");
  return <ChatPanel threadId={null} initialMessages={[]} initialFeedback={{}} />;
}
