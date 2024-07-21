import { UpdateAgentLLMConfig } from "../../Core/Data/MemGPT/Mod/UpdateAgentLLMConfig";
import { UpdateAllAgentLLMConfig } from "../../Core/Data/MemGPT/Mod/UpdateAllAgentLLMConfig";
import { IMemGPTModService } from "../../Core/Interfaces/IMemGPTModService";
import { MemGPTModService } from "../../Core/Services/MemGPTModService";
import { IMemGPTMod } from "../../Infrastructure/MemGPTMod";

export class MemGPTModController {
  private service: IMemGPTModService;

  constructor(private memGPTMod: IMemGPTMod) {
    this.service = new MemGPTModService(this.memGPTMod);
  }

  async updateAgentLLMConfig(data: UpdateAgentLLMConfig) {
    this.service.updateAgentLLMConfig(data);
  }

  async updateAllAgentsLLMConfig(data: UpdateAllAgentLLMConfig) {
    this.service.updateAllAgentsLLMConfig(data);
  }
}
