import { IMemGPTMod } from "../../Infrastructure/MemGPTMod";
import { UpdateAgentLLMConfig } from "../Data/MemGPT/Mod/UpdateAgentLLMConfig";
import { UpdateAllAgentLLMConfig } from "../Data/MemGPT/Mod/UpdateAllAgentLLMConfig";
import { IMemGPTModService } from "../Interfaces/IMemGPTModService";

export class MemGPTModService implements IMemGPTModService {
  constructor(private memGPTMod: IMemGPTMod) {}

  async updateAgentLLMConfig(data: UpdateAgentLLMConfig): Promise<void> {
    await this.memGPTMod.updateAgentLLMSettings(data.agent_id, data.llm_config);
  }

  async updateAllAgentsLLMConfig(data: UpdateAllAgentLLMConfig): Promise<void> {
    await this.memGPTMod.updateAllAgentLLMSettings(data.llm_config);
  }
}
