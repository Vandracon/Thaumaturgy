import { ThaumaturgyAgent } from "../../Core/Entities/Agent";
import { GetAgentsResponse } from "../Data/Agents/GetAgentsResponse";
import { GetFilteringResponse } from "../Data/OpenAIProtocol/GetFilteringResponse";
import { Filter } from "../Entities/Filter";

export interface IDataRepository {
  getAgentByName(name: string): Promise<Array<ThaumaturgyAgent>>;

  getAgents(page: number, pageSize: number): Promise<GetAgentsResponse>;

  saveCreatedPersonasAnalytics(
    personaCreateResponses: Array<any>,
  ): Promise<void>;

  saveCreatedAgentsAnalytics(createdAgentResponses: Array<any>): Promise<void>;

  saveCreatedAgentsToDatabase(agents: Array<ThaumaturgyAgent>): Promise<void>;

  storeMemGPTResponse(data: Array<any>): Promise<void>;

  getFiltering(): Promise<GetFilteringResponse>;
  setFiltering(data: Array<Filter>): Promise<void>;
}
