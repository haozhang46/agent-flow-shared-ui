import { describe, expect, it } from "vitest";
import { parseSseStream } from "../src/parseSseStream";

describe("parseSseStream", () => {
  it("parses message and done events", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode('event: message\ndata: {"content":"hi"}\n\n'),
        );
        controller.enqueue(new TextEncoder().encode("event: done\ndata: {}\n\n"));
        controller.close();
      },
    });

    const events = [];
    for await (const e of parseSseStream(body)) {
      events.push(e);
    }
    expect(events).toEqual([
      { type: "message", chunk: { content: "hi" } },
      { type: "done" },
    ]);
  });

  it("parses plan_ready events", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode('event: plan_ready\ndata: {"content":"# Plan"}\n\n'),
        );
        controller.close();
      },
    });

    const events = [];
    for await (const e of parseSseStream(body)) {
      events.push(e);
    }
    expect(events).toEqual([{ type: "plan_ready", content: "# Plan" }]);
  });

  it("parses thinking events", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'event: thinking\ndata: {"content":"let me reason"}\n\n',
          ),
        );
        controller.enqueue(
          new TextEncoder().encode('event: message\ndata: {"content":"done"}\n\n'),
        );
        controller.close();
      },
    });

    const events = [];
    for await (const e of parseSseStream(body)) {
      events.push(e);
    }
    expect(events).toEqual([
      { type: "thinking", chunk: { content: "let me reason" } },
      { type: "message", chunk: { content: "done" } },
    ]);
  });
});
