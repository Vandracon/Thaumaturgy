import { UpdateAgentLLMConfig } from "../Data/MemGPT/Mod/UpdateAgentLLMConfig";
import { UpdateAllAgentLLMConfig } from "../Data/MemGPT/Mod/UpdateAllAgentLLMConfig";

export interface IMemGPTModService {
  updateAgentLLMConfig(data: UpdateAgentLLMConfig): Promise<void>;
  updateAllAgentsLLMConfig(data: UpdateAllAgentLLMConfig): Promise<void>;
  updateAgentBaseSystemPrompt(
    agentId: string,
    newPrompt: string,
  ): Promise<void>;
  updateAllAgentsBaseSystemPrompt(newPrompt: string): Promise<void>;
}
