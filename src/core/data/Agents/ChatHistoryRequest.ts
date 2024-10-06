interface ToolCallFunction {
  arguments: string;
  name: string;
}

interface ToolCall {
  id: string;
  tool_call_type: string;
  function: ToolCallFunction;
}

interface Message {
  id: string;
  user_id: string;
  agent_id: string;
  text: string;
  model: string | null;
  created_at: string;
  role: "tool" | "assistant" | "user";
  name: string | null;
  embedding: unknown | null;
  embedding_dim: number | null;
  embedding_model: string | null;
  tool_calls: ToolCall[] | null;
  tool_call_id: string | null;
  in_context: boolean;
}

export interface ChatHistory {
  messages: Message[];
}
