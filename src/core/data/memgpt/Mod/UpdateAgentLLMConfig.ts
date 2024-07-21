import { LLMConfig } from "./LLMConfig";

export interface UpdateAgentLLMConfig {
  agent_id: string;
  llm_config: LLMConfig;
}
