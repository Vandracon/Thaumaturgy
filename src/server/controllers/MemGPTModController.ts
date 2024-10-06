import { GetAllAgentsMemGPTLLMConfig } from "../../Core/Data/MemGPT/Mod/GetAllAgentsMemGPTLLMConfig";
import { GetAllAgentsBaseSystemResponse } from "../../Core/Data/MemGPT/Mod/GetAllAgentsSystemPromptResponse";
import { UpdateAgentLLMConfig } from "../../Core/Data/MemGPT/Mod/UpdateAgentLLMConfig";
import { UpdateAgentSystemPromptData } from "../../Core/Data/MemGPT/Mod/UpdateAgentSystemPromptData";
import { UpdateAllAgentLLMConfig } from "../../Core/Data/MemGPT/Mod/UpdateAllAgentLLMConfig";
import { UpdateAllAgentsSystemPromptData } from "../../Core/Data/MemGPT/Mod/UpdateAllAgentsSystemPromptData";
import { IMemGPTModService } from "../../Core/Interfaces/IMemGPTModService";
import { MemGPTModService } from "../../Core/Services/MemGPTModService";
import { IMemGPTMod } from "../../Infrastructure/MemGPT/MemGPTMod";

export class MemGPTModController {
  private service: IMemGPTModService;

  constructor(private memGPTMod: IMemGPTMod) {
    this.service = new MemGPTModService(this.memGPTMod);
  }

  async updateAgentLLMConfig(data: UpdateAgentLLMConfig) {
    await this.service.updateAgentLLMConfig(data);
  }

  async updateAllAgentsLLMConfig(data: UpdateAllAgentLLMConfig) {
    await this.service.updateAllAgentsLLMConfig(data);
  }

  getAllAgentsLLMConfig(): GetAllAgentsMemGPTLLMConfig {
    return this.service.getAllAgentsLLMConfig();
  }

  async updateAgentBaseSystemPrompt(data: UpdateAgentSystemPromptData) {
    await this.service.updateAgentBaseSystemPrompt(
      data.agent_id,
      data.new_prompt,
    );
  }

  async updateAllAgentsBaseSystemPrompt(data: UpdateAllAgentsSystemPromptData) {
    await this.service.updateAllAgentsBaseSystemPrompt(data.new_prompt);
  }

  getAllAgentsBaseSystemPrompt(): GetAllAgentsBaseSystemResponse {
    return this.service.getAllAgentsBaseSystemPrompt();
  }
}
