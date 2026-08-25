// Server-sent events encoding for `POST /api/chat`: `event: <type>\ndata: <json>\n\n`.
// Pure helpers (unit-tested); `sseResponse` bridges an async generator to a Response.
import type { ChatEvent } from "./types";

export function encodeSse(event: ChatEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

/** Incremental SSE parser used by the browser client and tests. Feed chunks; get events. */
export function createSseParser() {
  let buffer = "";
  return function feed(chunk: string): ChatEvent[] {
    buffer += chunk;
    const events: ChatEvent[] = [];
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const data = frame.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trimStart()).join("\n");
      if (!data) continue;
      try {
        events.push(JSON.parse(data) as ChatEvent);
      } catch {
        events.push({ type: "error", message: "malformed event" });
      }
    }
    return events;
  };
}

export function sseResponse(events: AsyncIterable<ChatEvent>, opts: { onError?: (e: unknown) => void } = {}): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const ev of events) controller.enqueue(encoder.encode(encodeSse(ev)));
      } catch (e) {
        opts.onError?.(e);
        const message = e instanceof Error ? e.message : "chat failed";
        controller.enqueue(encoder.encode(encodeSse({ type: "error", message })));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" },
  });
}
