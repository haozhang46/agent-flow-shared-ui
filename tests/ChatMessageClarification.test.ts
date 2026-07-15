// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ChatMessage from "../src/components/ChatMessage.vue";

describe("ChatMessage clarification", () => {
  it("shows assistant bubble when only clarification is present", () => {
    const wrapper = mount(ChatMessage, {
      props: {
        msg: {
          role: "assistant",
          content: "",
          clarification: {
            clarificationId: "c1",
            threadId: "t1",
            question: "Q?",
            options: [{ id: "a", label: "A" }],
            allowMultiple: false,
            allowFreeText: false,
            status: "pending",
          },
        },
      },
    });

    expect(wrapper.text()).toContain("AI");
    expect(wrapper.text()).toContain("Q?");
    expect(wrapper.find('[data-testid="clarification-card"]').exists()).toBe(true);
  });

  it("emits clarify with clarificationId and submit payload", async () => {
    const wrapper = mount(ChatMessage, {
      props: {
        msg: {
          role: "assistant",
          content: "",
          clarification: {
            clarificationId: "c1",
            threadId: "t1",
            question: "Q?",
            options: [{ id: "a", label: "A" }],
            allowMultiple: false,
            allowFreeText: false,
            status: "pending",
          },
        },
      },
    });

    await wrapper.find('[data-testid="clarification-option-a"]').setValue(true);
    await wrapper.find('[data-testid="clarification-submit"]').trigger("click");

    expect(wrapper.emitted("clarify")).toEqual([
      [{ clarificationId: "c1", selectedOptionIds: ["a"], freeText: undefined }],
    ]);
  });
});
