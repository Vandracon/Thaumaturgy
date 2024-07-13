import { ThaumaturgyAgent } from "../../Core/Entities/Agent";

export interface IDataRepository {
  getAgentByName(name: string): Promise<Array<ThaumaturgyAgent>>;

  saveCreatedPersonasAnalytics(
    personaCreateResponses: Array<any>,
  ): Promise<void>;

  saveCreatedAgentsAnalytics(createdAgentResponses: Array<any>): Promise<void>;

  saveCreatedAgentsToDatabase(agents: Array<ThaumaturgyAgent>): Promise<void>;

  storeMemGPTResponse(data: Array<any>): Promise<void>;
}
