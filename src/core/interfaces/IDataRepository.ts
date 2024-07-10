import { Agent } from "../entities/Agent";

export interface IDataRepository {
  getAgentByName(name: string): Promise<Array<Agent>>;
}
