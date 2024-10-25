import { ChatHistory } from "../../Core/Data/Agents/ChatHistoryRequest";
import { ChatRequest } from "../../Core/Data/Agents/ChatRequest";
import { CreateAgentRequest } from "../../Core/Data/Agents/CreateAgentRequest";
import { GetAgentDetailsResponse } from "../../Core/Data/MemGPT/GetAgentDetailsResponse";
import { IAgentService } from "../../Core/Interfaces/IAgentService";
import { IDataRepository } from "../../Core/Interfaces/IDataRepository";
import { IMemGPTModService } from "../../Core/Interfaces/IMemGPTModService";
import { IMemGPTProvider } from "../../Core/Interfaces/IMemGPTProvider";
import { AgentService } from "../../Core/Services/AgentService";
import { MemGPTModService } from "../../Core/Services/MemGPTModService";
import { Utility } from "../../Core/Utils/Utility";
import { IMemGPTMod } from "../../Infrastructure/MemGPT/MemGPTMod";

export class AgentController {
  private agentService: IAgentService;
  private memGPTModService: IMemGPTModService;

  constructor(
    memGPTMod: IMemGPTMod,
    memGPTProvider: IMemGPTProvider,
    dataRepository: IDataRepository,
  ) {
    this.agentService = new AgentService(
      dataRepository,
      memGPTProvider,
      memGPTMod,
    );
    this.memGPTModService = new MemGPTModService(memGPTMod);
  }

  async getAgents(page: number, pageSize: number) {
    return await this.agentService.getAgents(page, pageSize);
  }

  async getAgentDetails(id: string): Promise<GetAgentDetailsResponse | null> {
    return await this.memGPTModService.getAgentDetails(id);
  }

  async updateAgentMemory(
    id: string,
    human: string,
    persona: string,
    model: string,
  ): Promise<void> {
    return await this.agentService.updateAgentMemory(id, human, persona, model);
  }

  async createAgent(data: CreateAgentRequest): Promise<void> {
    return await this.agentService.createAgent(data);
  }

  async chatToAgent(agentId: string, data: ChatRequest): Promise<any> {
    return await this.agentService.chatToAgent(agentId, data);
  }

  async getChatHistory(
    agentId: string,
    start: number,
    count: number,
  ): Promise<ChatHistory> {
    return await this.agentService.getChatHistory(agentId, start, count);
  }
}
