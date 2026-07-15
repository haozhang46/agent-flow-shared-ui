import { describe, expect, it } from "vitest";
import { parseSseStream } from "../src/parseSseStream";

function enc(text: string): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });
}

describe("parseSseStream clarification", () => {
  it("parses clarification event", async () => {
    const body = enc(
      `event: clarification\ndata: ${JSON.stringify({
        clarification_id: "c1",
        thread_id: "t1",
        question: "Q?",
        options: [{ id: "a", label: "A" }],
        allow_multiple: false,
        allow_free_text: true,
        status: "pending",
      })}\n\nevent: done\ndata: {"awaiting_clarification":true}\n\n`,
    );
    const events = [];
    for await (const e of parseSseStream(body)) events.push(e);
    expect(events[0]?.type).toBe("clarification");
    expect(events[1]).toEqual({ type: "done", awaiting_clarification: true });
  });

  it("parses done without awaiting_clarification as false", async () => {
    const body = enc('event: done\ndata: {"awaiting_clarification":false}\n\n');
    const events = [];
    for await (const e of parseSseStream(body)) events.push(e);
    expect(events).toEqual([{ type: "done", awaiting_clarification: false }]);
  });
});
