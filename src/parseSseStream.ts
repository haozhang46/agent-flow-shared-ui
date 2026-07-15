import type { ChatResponseChunk, ToolEvent } from "../types/chat";

export type ClarificationOption = {
  id: string;
  label: string;
};

export type ClarificationStatus = "pending" | "answered" | "cancelled";

export type ClarificationSsePayload = {
  clarification_id: string;
  thread_id: string;
  question: string;
  options: ClarificationOption[];
  allow_multiple: boolean;
  allow_free_text: boolean;
  status: ClarificationStatus;
};

export type SseEvent =
  | { type: "message"; chunk: ChatResponseChunk }
  | { type: "tool_start"; event: ToolEvent }
  | { type: "tool_end"; event: ToolEvent }
  | { type: "plan_ready"; content: string }
  | { type: "clarification"; clarification: ClarificationSsePayload }
  | { type: "done"; awaiting_clarification?: boolean };

function parseClarificationPayload(data: unknown): ClarificationSsePayload | null {
  if (!data || typeof data !== "object") return null;

  const raw = data as Record<string, unknown>;
  const source =
    raw.clarification && typeof raw.clarification === "object"
      ? (raw.clarification as Record<string, unknown>)
      : raw;

  if (typeof source.clarification_id !== "string") return null;

  const options = Array.isArray(source.options)
    ? source.options.filter(
        (option): option is ClarificationOption =>
          !!option &&
          typeof option === "object" &&
          typeof (option as ClarificationOption).id === "string" &&
          typeof (option as ClarificationOption).label === "string",
      )
    : [];

  const status = source.status;
  const validStatus: ClarificationStatus =
    status === "pending" || status === "answered" || status === "cancelled"
      ? status
      : "pending";

  return {
    clarification_id: source.clarification_id,
    thread_id: typeof source.thread_id === "string" ? source.thread_id : "",
    question: typeof source.question === "string" ? source.question : "",
    options,
    allow_multiple: Boolean(source.allow_multiple),
    allow_free_text: source.allow_free_text !== false,
    status: validStatus,
  };
}

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
          const awaiting =
            data &&
            typeof data === "object" &&
            (data as { awaiting_clarification?: unknown }).awaiting_clarification === true;
          yield awaiting
            ? { type: "done", awaiting_clarification: true }
            : { type: "done" };
        } else if (currentEvent === "clarification") {
          const clarification = parseClarificationPayload(data);
          if (clarification) {
            yield { type: "clarification", clarification };
          }
        } else if (currentEvent === "plan_ready") {
          yield { type: "plan_ready", content: String(data.content ?? "") };
        } else if (currentEvent === "tool_start") {
          yield { type: "tool_start", event: data as ToolEvent };
        } else if (currentEvent === "tool_end") {
          yield { type: "tool_end", event: data as ToolEvent };
        } else {
          yield { type: "message", chunk: data as ChatResponseChunk };
        }
      } catch {
        // skip unparseable chunks
      }
    }
  }
}
