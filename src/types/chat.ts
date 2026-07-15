export type ToolRunStatus = "running" | "done" | "error";

export interface ToolRun {
  callId: string;
  name: string;
  status: ToolRunStatus;
  output?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  citations?: string[];
  attachments?: string[];
  toolRuns?: ToolRun[];
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
