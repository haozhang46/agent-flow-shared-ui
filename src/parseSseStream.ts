import type { ChatResponseChunk, ToolEvent, TraceEvent, UsageEvent } from "../types/chat";

export type SseEvent =
  | { type: "message"; chunk: ChatResponseChunk }
  | { type: "thinking"; chunk: ChatResponseChunk }
  | { type: "tool_start"; event: ToolEvent }
  | { type: "tool_end"; event: ToolEvent }
  | { type: "trace"; event: TraceEvent }
  | { type: "usage"; event: UsageEvent }
  | { type: "plan_ready"; content: string }
  | { type: "done" };

export async function* parseSseStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<SseEvent> {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let currentEvent = "message";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim();
        continue;
      }
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (currentEvent === "done") {
          yield { type: "done" };
        } else if (currentEvent === "plan_ready") {
          yield { type: "plan_ready", content: String(data.content ?? "") };
        } else if (currentEvent === "thinking") {
          yield { type: "thinking", chunk: data as ChatResponseChunk };
        } else if (currentEvent === "tool_start") {
          yield { type: "tool_start", event: data as ToolEvent };
        } else if (currentEvent === "tool_end") {
          yield { type: "tool_end", event: data as ToolEvent };
        } else if (currentEvent === "trace") {
          yield { type: "trace", event: data as TraceEvent };
        } else if (currentEvent === "usage") {
          yield { type: "usage", event: data as UsageEvent };
        } else {
          yield { type: "message", chunk: data as ChatResponseChunk };
        }
      } catch {
        // skip unparseable chunks
      }
    }
  }
}
