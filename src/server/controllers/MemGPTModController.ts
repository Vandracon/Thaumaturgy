import { UpdateAgentLLMConfig } from "../../Core/Data/MemGPT/Mod/UpdateAgentLLMConfig";
import { UpdateAgentSystemPromptData } from "../../Core/Data/MemGPT/Mod/UpdateAgentSystemPromptData";
import { UpdateAllAgentLLMConfig } from "../../Core/Data/MemGPT/Mod/UpdateAllAgentLLMConfig";
import { UpdateAllAgentsSystemPromptData } from "../../Core/Data/MemGPT/Mod/UpdateAllAgentsSystemPromptData";
import { IMemGPTModService } from "../../Core/Interfaces/IMemGPTModService";
import { MemGPTModService } from "../../Core/Services/MemGPTModService";
import { IMemGPTMod } from "../../Infrastructure/MemGPTMod";

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

  async updateAgentBaseSystemPrompt(data: UpdateAgentSystemPromptData) {
    await this.service.updateAgentBaseSystemPrompt(
      data.agent_id,
      data.new_prompt,
    );
  }

  async updateAllAgentsBaseSystemPrompt(data: UpdateAllAgentsSystemPromptData) {
    await this.service.updateAllAgentsBaseSystemPrompt(data.new_prompt);
  }
}
