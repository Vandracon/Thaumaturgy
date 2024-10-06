import { ChatHistory } from "../Data/Agents/ChatHistoryRequest";
import { ChatRequest } from "../Data/Agents/ChatRequest";
import { CreateAgentRequest } from "../Data/Agents/CreateAgentRequest";
import { GetAgentsResponse } from "../Data/Agents/GetAgentsResponse";

export interface IAgentService {
  getAgents(page: number, pageSize: number): Promise<GetAgentsResponse>;
  updateAgentMemory(id: string, human: string, persona: string): Promise<void>;
  createAgent(data: CreateAgentRequest): Promise<void>;
  chatToAgent(agentId: string, data: ChatRequest): Promise<any>;
  getChatHistory(
    agentId: string,
    start: number,
    count: number,
  ): Promise<ChatHistory>;
}
