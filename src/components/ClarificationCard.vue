<template>
  <div
    data-testid="clarification-card"
    class="mt-2 not-prose rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-3 text-sm"
    :class="{
      'opacity-50 pointer-events-none': clarification.status === 'cancelled',
      'opacity-70': clarification.status === 'submitting',
    }"
  >
    <p class="font-medium text-gray-800 dark:text-gray-100 mb-2">{{ clarification.question }}</p>

    <!-- Answered: read-only summary -->
    <div v-if="clarification.status === 'answered'" data-testid="clarification-summary">
      <ul class="space-y-1 text-gray-700 dark:text-gray-200">
        <li v-for="label in answeredLabels" :key="label">{{ label }}</li>
      </ul>
      <p
        v-if="clarification.freeText"
        class="mt-2 text-gray-500 dark:text-gray-400 whitespace-pre-wrap"
      >
        {{ clarification.freeText }}
      </p>
    </div>

    <!-- Interactive / cancelled form -->
    <div v-else>
      <div class="space-y-2">
        <label
          v-for="opt in clarification.options"
          :key="opt.id"
          class="flex items-center gap-2 cursor-pointer"
        >
          <input
            v-if="clarification.allowMultiple"
            type="checkbox"
            :value="opt.id"
            :checked="selectedIds.includes(opt.id)"
            :disabled="!interactive"
            :data-testid="`clarification-option-${opt.id}`"
            class="rounded border-gray-300"
            @change="toggleMulti(opt.id, ($event.target as HTMLInputElement).checked)"
          />
          <input
            v-else
            type="radio"
            :name="`clarification-${clarification.clarificationId}`"
            :value="opt.id"
            :checked="selectedIds[0] === opt.id"
            :disabled="!interactive"
            :data-testid="`clarification-option-${opt.id}`"
            class="border-gray-300"
            @change="selectSingle(opt.id)"
          />
          <span>{{ opt.label }}</span>
        </label>
      </div>

      <textarea
        v-if="clarification.allowFreeText"
        v-model="freeText"
        data-testid="clarification-freetext"
        :disabled="!interactive"
        rows="2"
        placeholder="补充说明（可选）"
        class="mt-3 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 outline-none focus:border-blue-400 resize-y"
      />

      <button
        v-if="interactive"
        type="button"
        data-testid="clarification-submit"
        class="mt-3 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="!canSubmit"
        @click="onSubmit"
      >
        {{ clarification.status === "submitting" ? "提交中…" : "提交" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { ClarificationState } from "../types/chat";

const props = defineProps<{ clarification: ClarificationState }>();
const emit = defineEmits<{
  submit: [payload: { selectedOptionIds: string[]; freeText?: string }];
}>();

const selectedIds = ref<string[]>([...(props.clarification.selectedOptionIds ?? [])]);
const freeText = ref(props.clarification.freeText ?? "");

watch(
  () => props.clarification,
  (c) => {
    selectedIds.value = [...(c.selectedOptionIds ?? [])];
    freeText.value = c.freeText ?? "";
  },
  { deep: true },
);

const interactive = computed(
  () => props.clarification.status === "pending" || props.clarification.status === "submitting",
);

const canSubmit = computed(() => {
  if (!interactive.value || props.clarification.status === "submitting") return false;
  if (selectedIds.value.length > 0) return true;
  if (props.clarification.allowFreeText && freeText.value.trim()) return true;
  return false;
});

const answeredLabels = computed(() => {
  const ids = new Set(props.clarification.selectedOptionIds ?? []);
  return props.clarification.options.filter((o) => ids.has(o.id)).map((o) => o.label);
});

function selectSingle(id: string) {
  selectedIds.value = [id];
}

function toggleMulti(id: string, checked: boolean) {
  if (checked) {
    if (!selectedIds.value.includes(id)) selectedIds.value = [...selectedIds.value, id];
  } else {
    selectedIds.value = selectedIds.value.filter((x) => x !== id);
  }
}

function onSubmit() {
  if (!canSubmit.value) return;
  const trimmed = freeText.value.trim();
  emit("submit", {
    selectedOptionIds: [...selectedIds.value],
    freeText: trimmed || undefined,
  });
}
</script>
