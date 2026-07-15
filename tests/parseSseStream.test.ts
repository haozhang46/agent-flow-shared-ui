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

  it("parses clarification events", async () => {
    const payload = {
      clarification_id: "call_1",
      thread_id: "ask:t1",
      question: "Need web search?",
      options: [
        { id: "yes", label: "Yes" },
        { id: "no", label: "No" },
      ],
      allow_multiple: false,
      allow_free_text: true,
      status: "pending",
    };
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            `event: clarification\ndata: ${JSON.stringify(payload)}\n\n`,
          ),
        );
        controller.close();
      },
    });

    const events = [];
    for await (const e of parseSseStream(body)) {
      events.push(e);
    }
    expect(events).toEqual([{ type: "clarification", clarification: payload }]);
  });

  it("parses clarification events with file-chat wrapped payload", async () => {
    const payload = {
      type: "clarification",
      clarification_id: "call_2",
      thread_id: "file:wf:step:t1",
      question: "Which file?",
      options: [{ id: "a", label: "A.ts" }],
      allow_multiple: false,
      allow_free_text: false,
      status: "pending",
    };
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            `event: clarification\ndata: ${JSON.stringify(payload)}\n\n`,
          ),
        );
        controller.close();
      },
    });

    const events = [];
    for await (const e of parseSseStream(body)) {
      events.push(e);
    }
    expect(events).toEqual([
      {
        type: "clarification",
        clarification: {
          clarification_id: "call_2",
          thread_id: "file:wf:step:t1",
          question: "Which file?",
          options: [{ id: "a", label: "A.ts" }],
          allow_multiple: false,
          allow_free_text: false,
          status: "pending",
        },
      },
    ]);
  });

  it("parses done with awaiting_clarification", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'event: done\ndata: {"awaiting_clarification":true}\n\n',
          ),
        );
        controller.close();
      },
    });

    const events = [];
    for await (const e of parseSseStream(body)) {
      events.push(e);
    }
    expect(events).toEqual([{ type: "done", awaiting_clarification: true }]);
  });

  it("parses done with file-chat wrapped awaiting_clarification", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'event: done\ndata: {"type":"done","awaiting_clarification":true}\n\n',
          ),
        );
        controller.close();
      },
    });

    const events = [];
    for await (const e of parseSseStream(body)) {
      events.push(e);
    }
    expect(events).toEqual([{ type: "done", awaiting_clarification: true }]);
  });
});
