import type { ChatStreamRequest, ChatResponseChunk } from "../types/chat";
import { parseSseStream, type SseEvent } from "../parseSseStream";

export type CreateChatStreamOptions = {
  postChat: (req: ChatStreamRequest) => Promise<Response>;
  onEvent?: (event: SseEvent) => void;
};

export function createChatStream(options: CreateChatStreamOptions) {
  return async function* streamChat(
    req: ChatStreamRequest,
  ): AsyncGenerator<ChatResponseChunk> {
    const res = await options.postChat(req);
    if (!res.ok || !res.body) {
      throw new Error(`Chat request failed: ${res.status}`);
    }
    for await (const event of parseSseStream(res.body)) {
      options.onEvent?.(event);
      if (event.type === "message") {
        yield event.chunk;
      }
    }
  };
}
