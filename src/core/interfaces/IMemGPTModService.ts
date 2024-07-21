import { UpdateAgentLLMConfig } from "../Data/MemGPT/Mod/UpdateAgentLLMConfig";
import { UpdateAllAgentLLMConfig } from "../Data/MemGPT/Mod/UpdateAllAgentLLMConfig";

export interface IMemGPTModService {
  updateAgentLLMConfig(data: UpdateAgentLLMConfig): Promise<void>;
  updateAllAgentsLLMConfig(data: UpdateAllAgentLLMConfig): Promise<void>;
}
