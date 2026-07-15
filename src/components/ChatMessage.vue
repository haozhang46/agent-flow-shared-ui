<template>
  <div class="mb-4 min-w-0">
    <div v-if="msg.role === 'user'" class="flex justify-end min-w-0">
      <div class="max-w-[95%] min-w-0 bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3 break-words">
        <div v-if="msg.attachments?.length" class="mb-2 flex flex-wrap gap-1">
          <span
            v-for="path in msg.attachments"
            :key="path"
            data-testid="message-attachment-chip"
            class="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full"
          >
            {{ path.split("/").pop() }}
          </span>
        </div>
        <p class="whitespace-pre-wrap break-words">{{ msg.content }}</p>
      </div>
    </div>
    <div
      v-else-if="streaming || msg.content || msg.thinking || msg.clarification"
      class="flex gap-3 min-w-0"
    >
      <div class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 flex items-center justify-center text-sm">
        AI
      </div>
      <div class="max-w-[95%] min-w-0">
        <div
          class="chat-message-content bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3 prose dark:prose-invert max-w-none break-words"
        >
          <details
            v-if="msg.thinking"
            class="mb-3 not-prose text-xs border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
            data-testid="thinking-block"
            open
          >
            <summary class="cursor-pointer px-3 py-2 text-gray-500 dark:text-gray-400 select-none">
              思考过程
            </summary>
            <pre class="px-3 py-2 whitespace-pre-wrap text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/60 m-0">{{ msg.thinking }}</pre>
          </details>
          <ToolActivityList v-if="msg.toolRuns?.length" :runs="msg.toolRuns" />
          <div v-if="msg.content" v-html="renderMarkdown(msg.content)" />
          <span
            v-if="streaming"
            data-testid="streaming-cursor"
            class="inline-block w-0.5 h-4 ml-0.5 align-text-bottom bg-gray-500 animate-pulse"
            aria-hidden="true"
          />
          <ClarificationCard
            v-if="msg.clarification"
            :clarification="msg.clarification"
            @submit="onClarifySubmit"
          />
        </div>
        <div v-if="msg.citations && msg.citations.length" class="mt-2 flex flex-wrap gap-1">
          <span
            v-for="cite in msg.citations"
            :key="cite"
            class="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full"
          >
            {{ cite }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from "marked";
import type { ChatMessage } from "../types/chat";
import ClarificationCard from "./ClarificationCard.vue";
import ToolActivityList from "./ToolActivityList.vue";

const props = defineProps<{ msg: ChatMessage; streaming?: boolean }>();
const emit = defineEmits<{
  clarify: [
    payload: {
      clarificationId: string;
      selectedOptionIds: string[];
      freeText?: string;
    },
  ];
}>();

function renderMarkdown(text: string): string {
  if (!text) return "";
  return marked.parse(text) as string;
}

function onClarifySubmit(payload: { selectedOptionIds: string[]; freeText?: string }) {
  const id = props.msg.clarification?.clarificationId;
  if (!id) return;
  emit("clarify", {
    clarificationId: id,
    selectedOptionIds: payload.selectedOptionIds,
    freeText: payload.freeText,
  });
}
</script>

<style scoped>
.chat-message-content :deep(p),
.chat-message-content :deep(li),
.chat-message-content :deep(a),
.chat-message-content :deep(pre),
.chat-message-content :deep(code) {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.chat-message-content :deep(pre),
.chat-message-content :deep(code) {
  white-space: pre-wrap;
}

.chat-message-content :deep(pre) {
  max-width: 100%;
}
</style>
