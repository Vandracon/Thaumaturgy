export interface ChatHistoryEntry {
  role: string;
  text: string;
  model: string;
  name: string;
  tool_calls: string;
  created_at: string;
}

export interface GetAgentChatHistoryResponse {
  entries: Array<ChatHistoryEntry>;
  totalCount: number;
}
