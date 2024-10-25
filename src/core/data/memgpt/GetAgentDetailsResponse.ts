import { LLMConfig } from "./Mod/LLMConfig";

export interface GetAgentDetailsResponse {
  state: string;
  llm_config: LLMConfig;
}
