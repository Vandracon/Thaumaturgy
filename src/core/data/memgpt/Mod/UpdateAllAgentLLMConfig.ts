import { LLMConfig } from "./LLMConfig";

export interface UpdateAllAgentLLMConfig {
  llm_config: LLMConfig;
  update_agents: boolean;
}
