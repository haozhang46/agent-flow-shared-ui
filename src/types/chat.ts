export type ToolRunStatus = "running" | "done" | "error";

export interface ToolRun {
  callId: string;
  name: string;
  status: ToolRunStatus;
  output?: string;
}

export interface ClarificationOption {
  id: string;
  label: string;
}

export type ClarificationStatus = "pending" | "submitting" | "answered" | "cancelled";

export interface ClarificationState {
  clarificationId: string;
  threadId: string;
  question: string;
  options: ClarificationOption[];
  allowMultiple: boolean;
  allowFreeText: boolean;
  status: ClarificationStatus;
  selectedOptionIds?: string[];
  freeText?: string;
}

/** Snake_case SSE payload from backend `event: clarification`. */
export interface ClarificationPayload {
  clarification_id: string;
  thread_id: string;
  question: string;
  options: ClarificationOption[];
  allow_multiple: boolean;
  allow_free_text: boolean;
  status: ClarificationStatus;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  citations?: string[];
  attachments?: string[];
  toolRuns?: ToolRun[];
  clarification?: ClarificationState;
}

export interface ChatResponseChunk {
  content?: string;
  citations?: string[];
  done?: boolean;
}

export interface ToolEvent {
  call_id?: string;
  name?: string;
  ok?: boolean;
  input?: unknown;
  output?: string;
}

export interface TraceEvent {
  trace_id: string;
  langfuse_url: string;
}

export interface UsageEvent {
  input_tokens: number;
  output_tokens: number;
  model: string;
}

export type ChatAttachment = { path: string; label: string };
