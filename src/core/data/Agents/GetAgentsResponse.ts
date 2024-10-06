import { ThaumaturgyAgent } from "../../Entities/Agent";

export interface GetAgentsResponse {
  agents: Array<ThaumaturgyAgent>;
  totalCount: number;
}
