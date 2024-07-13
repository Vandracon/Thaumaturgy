import { Message } from "./LLMChatCompletionRequestBody";

export interface LLMChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<Choice>;
  usage: Usage;
}

export interface Choice {
  index: number;
  message: Message | StreamMessage;
  finish_reason: string;
}

export interface StreamMessage {
  index: number;
  delta: Message;
  finish_reason: string | null;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}
