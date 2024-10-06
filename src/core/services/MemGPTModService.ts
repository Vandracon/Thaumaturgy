import { IMemGPTMod } from "../../Infrastructure/MemGPT/MemGPTMod";
import { GetAgentDetailsResponse } from "../Data/MemGPT/GetAgentDetailsResponse";
import { GetAllAgentsMemGPTLLMConfig } from "../Data/MemGPT/Mod/GetAllAgentsMemGPTLLMConfig";
import { GetAllAgentsBaseSystemResponse } from "../Data/MemGPT/Mod/GetAllAgentsSystemPromptResponse";
import { UpdateAgentLLMConfig } from "../Data/MemGPT/Mod/UpdateAgentLLMConfig";
import { UpdateAllAgentLLMConfig } from "../Data/MemGPT/Mod/UpdateAllAgentLLMConfig";
import { IMemGPTModService } from "../Interfaces/IMemGPTModService";
import { Utility } from "../Utils/Utility";

export class MemGPTModService implements IMemGPTModService {
  constructor(private memGPTMod: IMemGPTMod) {}

  async updateAgentLLMConfig(data: UpdateAgentLLMConfig): Promise<void> {
    await this.memGPTMod.updateAgentLLMSettings(data.agent_id, data.llm_config);
  }

  async updateAllAgentsLLMConfig(data: UpdateAllAgentLLMConfig): Promise<void> {
    await this.memGPTMod.updateAllAgentLLMSettings(data.llm_config);
  }

  getAllAgentsLLMConfig(): GetAllAgentsMemGPTLLMConfig {
    let config = Utility.getMemGPTLLMConfig();

    return {
      config,
    };
  }

  async updateAgentBaseSystemPrompt(
    agentId: string,
    newPrompt: string,
  ): Promise<void> {
    await this.memGPTMod.updateAgentBaseSystemPrompt(agentId, newPrompt);
  }

  async updateAllAgentsBaseSystemPrompt(newPrompt: string): Promise<void> {
    await this.memGPTMod.updateAllAgentsBaseSystemPrompt(newPrompt);
  }

  getAllAgentsBaseSystemPrompt(): GetAllAgentsBaseSystemResponse {
    let prompt = Utility.getSystemPromptSync();

    return {
      prompt,
    };
  }

  async getAgentDetails(id: string): Promise<GetAgentDetailsResponse | null> {
    return this.memGPTMod.getAgentDetails(id);
  }
}
