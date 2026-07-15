import { describe, expect, it } from "vitest";
import { createChatStream } from "../src/lib/createChatStream";

function mockSseResponse(lines: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(new TextEncoder().encode(line));
      }
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

describe("createChatStream", () => {
  it("yields content chunks from SSE messages", async () => {
    const stream = createChatStream({
      postChat: async () =>
        mockSseResponse([
          'event: message\ndata: {"content":"hello"}\n\n',
          "event: done\ndata: {}\n\n",
        ]),
    });

    const chunks = [];
    for await (const chunk of stream({ threadId: "t1", message: "hi" })) {
      chunks.push(chunk);
    }
    expect(chunks).toEqual([{ content: "hello" }]);
  });

  it("throws when response is not ok", async () => {
    const stream = createChatStream({
      postChat: async () => new Response(null, { status: 500 }),
    });

    await expect(async () => {
      for await (const _ of stream({ threadId: "t1", message: "hi" })) {
        // consume
      }
    }).rejects.toThrow("Chat request failed: 500");
  });

  it("calls onEvent for tool events", async () => {
    const events: string[] = [];
    const stream = createChatStream({
      postChat: async () =>
        mockSseResponse([
          'event: tool_start\ndata: {"name":"git_status"}\n\n',
          'event: message\ndata: {"content":"done"}\n\n',
        ]),
      onEvent: (e) => events.push(e.type),
    });

    for await (const _ of stream({ threadId: "t1", message: "hi" })) {
      // consume
    }
    expect(events).toEqual(["tool_start", "message"]);
  });
});
