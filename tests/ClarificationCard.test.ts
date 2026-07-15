// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ClarificationCard from "../src/components/ClarificationCard.vue";
import type { ClarificationState } from "../src/types/chat";

function pendingState(overrides: Partial<ClarificationState> = {}): ClarificationState {
  return {
    clarificationId: "c1",
    threadId: "t1",
    question: "Need search?",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
    ],
    allowMultiple: false,
    allowFreeText: true,
    status: "pending",
    ...overrides,
  };
}

describe("ClarificationCard", () => {
  it("emits submit with selectedOptionIds and freeText", async () => {
    const wrapper = mount(ClarificationCard, {
      props: { clarification: pendingState() },
    });

    expect(wrapper.text()).toContain("Need search?");
    await wrapper.find('[data-testid="clarification-option-yes"]').setValue(true);
    await wrapper.find('[data-testid="clarification-freetext"]').setValue("today only");
    await wrapper.find('[data-testid="clarification-submit"]').trigger("click");

    expect(wrapper.emitted("submit")).toEqual([
      [{ selectedOptionIds: ["yes"], freeText: "today only" }],
    ]);
  });

  it("disables submit until an option is selected or free text is non-empty", async () => {
    const wrapper = mount(ClarificationCard, {
      props: { clarification: pendingState() },
    });

    const submit = wrapper.find('[data-testid="clarification-submit"]');
    expect(submit.attributes("disabled")).toBeDefined();

    await wrapper.find('[data-testid="clarification-freetext"]').setValue("note");
    expect(submit.attributes("disabled")).toBeUndefined();
  });

  it("shows read-only summary when answered", () => {
    const wrapper = mount(ClarificationCard, {
      props: {
        clarification: pendingState({
          status: "answered",
          selectedOptionIds: ["yes"],
          freeText: "ok",
        }),
      },
    });

    expect(wrapper.find('[data-testid="clarification-submit"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("Yes");
    expect(wrapper.text()).toContain("ok");
  });

  it("dims cancelled card", () => {
    const wrapper = mount(ClarificationCard, {
      props: { clarification: pendingState({ status: "cancelled" }) },
    });

    expect(wrapper.find('[data-testid="clarification-card"]').classes().join(" ")).toMatch(
      /opacity|opacity-/,
    );
  });

  it("disables inputs while submitting but keeps submit button visible", () => {
    const wrapper = mount(ClarificationCard, {
      props: {
        clarification: pendingState({
          status: "submitting",
          selectedOptionIds: ["yes"],
        }),
      },
    });

    const option = wrapper.find('[data-testid="clarification-option-yes"]');
    expect(option.attributes("disabled")).toBeDefined();
    const submit = wrapper.find('[data-testid="clarification-submit"]');
    expect(submit.exists()).toBe(true);
    expect(submit.attributes("disabled")).toBeDefined();
    expect(submit.text()).toContain("提交中");
  });
});
