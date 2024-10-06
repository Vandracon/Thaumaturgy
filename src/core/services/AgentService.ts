import { HttpStatusCode } from "axios";
import { HttpException } from "../../Server/middleware/ErrorHandlingMiddleware";
import { CreateAgentRequest } from "../Data/Agents/CreateAgentRequest";
import { GetAgentsResponse } from "../Data/Agents/GetAgentsResponse";
import { Agent, ThaumaturgyAgent } from "../Entities/Agent";
import { IAgentService } from "../Interfaces/IAgentService";
import { IDataRepository } from "../Interfaces/IDataRepository";
import { IMemGPTProvider } from "../Interfaces/IMemGPTProvider";
import { Utility } from "../Utils/Utility";
import config from "config";
import { ChatRequest } from "../Data/Agents/ChatRequest";
import { ChatHistory } from "../Data/Agents/ChatHistoryRequest";

export class AgentService implements IAgentService {
  constructor(
    private dataRepository: IDataRepository,
    private memGPTProvider: IMemGPTProvider,
  ) {}

  async chatToAgent(agentId: string, data: ChatRequest): Promise<any> {
    return this.memGPTProvider.sendNonStreamingMessage(agentId, data.message);
  }

  getAgents(page: number, pageSize: number): Promise<GetAgentsResponse> {
    return this.dataRepository.getAgents(page, pageSize);
  }

  updateAgentMemory(id: string, human: string, persona: string): Promise<void> {
    return this.memGPTProvider.updateCoreMemory(id, human, persona);
  }

  async createAgent(data: CreateAgentRequest): Promise<void> {
    let existingAgent = await this.dataRepository.getAgentByName(
      data.config.name,
    );

    if (existingAgent.length > 0) {
      throw new HttpException(
        HttpStatusCode.Forbidden,
        "Agent with that name already exists",
      );
    }

    let systemPrompt = Utility.getSystemPromptSync();

    let agent = new Agent(
      data.config.name,
      `${config.THAUMATURGY.DOMAIN}_character`,
      data.config.human,
      data.config.name,
      data.config.persona,
      data.config.model,
      Utility.convertFunctionListToSchema(data.config.function_names),
    );

    let createAgentResponses = await this.memGPTProvider.createAgents(
      [agent],
      systemPrompt,
    );

    await this.dataRepository.saveCreatedAgentsAnalytics(createAgentResponses);

    let thaumAgents: Array<ThaumaturgyAgent> = [];
    for (let i = 0; i < createAgentResponses.length; i++) {
      thaumAgents.push(
        new ThaumaturgyAgent(
          createAgentResponses[i].agent_state.id,
          createAgentResponses[i].agent_state.name,
          "",
          data.config.persona,
        ),
      );
    }

    await this.dataRepository.saveCreatedAgentsToDatabase(thaumAgents);

    return createAgentResponses[0];
  }

  getChatHistory(
    agentId: string,
    start: number,
    count: number,
  ): Promise<ChatHistory> {
    return this.memGPTProvider.getChatHistory(agentId, start, count);
  }
}
