export interface LLMChatCompletionRequestBody {
  messages: Array<Message>;
  model: string;
  frequency_penalty: number;
  max_tokens: number;
  stop: Array<string>;
  stream: boolean;
  temperature: number;
  top_p: number;
}

export interface Message {
  role: string;
  content: string;
}
