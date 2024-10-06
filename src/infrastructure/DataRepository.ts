import { GetAgentsResponse } from "../Core/Data/Agents/GetAgentsResponse";
import { ThaumaturgyAgent } from "../Core/Entities/Agent";
import { IDatabaseClient } from "../Core/Interfaces/IDatabaseClient";
import { IDataRepository } from "../Core/Interfaces/IDataRepository";

export class DataRepository implements IDataRepository {
  constructor(private dbClient: IDatabaseClient) {}

  async getAgentByName(name: string): Promise<Array<ThaumaturgyAgent>> {
    return this.dbClient.selectData(`SELECT * FROM agents WHERE name = ?`, [
      name,
    ]);
  }

  async getAgents(page: number, pageSize: number): Promise<GetAgentsResponse> {
    let agents = await this.dbClient.selectData(
      `SELECT * FROM agents ORDER BY name LIMIT ? OFFSET ?`,
      [pageSize, (page - 1) * pageSize],
    );

    let totalCount = 0;
    const result = await this.dbClient.selectData(
      `SELECT COUNT(*) as totalCount FROM agents`,
      [],
    );
    if (result && result.length > 0) {
      totalCount = result[0].totalCount;
    }

    return {
      agents,
      totalCount,
    };
  }

  async saveCreatedPersonasAnalytics(
    personaCreateResponses: Array<any>,
  ): Promise<void> {
    const placeholders = personaCreateResponses.map(() => "(?)").join(", ");
    const values = personaCreateResponses.reduce(
      (acc, cur) => [...acc, JSON.stringify(cur)],
      [],
    );

    const sql = `INSERT INTO created_personas (json) VALUES ${placeholders}`;
    await this.dbClient.insertDebugData(sql, values);
  }

  async saveCreatedAgentsAnalytics(createdAgentsResponses: Array<any>) {
    const placeholders = createdAgentsResponses.map(() => "(?)").join(", ");
    const values = createdAgentsResponses.reduce(
      (acc, cur) => [...acc, JSON.stringify(cur)],
      [],
    );

    const sql = `INSERT INTO created_agents (json) VALUES ${placeholders}`;
    await this.dbClient.insertDebugData(sql, values);
  }

  async saveCreatedAgentsToDatabase(
    agents: Array<ThaumaturgyAgent>,
  ): Promise<void> {
    let insert: any = [];
    for (let agent of agents) {
      insert.push({
        id: agent.id,
        name: agent.name,
        initial_persona_header: agent.initial_persona_header,
        initial_persona: agent.initial_persona,
      });
    }

    const placeholders = insert.map(() => "(?, ?, ?, ?)").join(", ");
    const values = insert.reduce(
      (acc: any, cur: any) => [
        ...acc,
        cur.id,
        cur.name,
        cur.initial_persona_header,
        cur.initial_persona,
      ],
      [],
    );

    const sql = `INSERT INTO agents (id, name, initial_persona_header, initial_persona) VALUES ${placeholders}`;

    await this.dbClient.insertData(sql, values);
  }

  async storeMemGPTResponse(data: Array<any>): Promise<void> {
    let lastMessageIdQueryResponse = await this.dbClient.selectData(
      `SELECT MAX(message_id) AS lastMsgId FROM messages;`,
      [],
    );

    let message_id = 1;
    if (lastMessageIdQueryResponse.length) {
      let lastMsgId = Number.parseInt(lastMessageIdQueryResponse[0].lastMsgId);
      if (!isNaN(lastMsgId)) {
        lastMsgId++;
        message_id = lastMsgId;
      }
    }

    let insert: any = [];
    for (let msg of data) {
      insert.push({
        message_id: message_id,
        json: JSON.stringify(msg),
      });
    }

    const placeholders = insert.map(() => "(?, ?)").join(", ");
    const values = insert.reduce(
      (acc: any, cur: any) => [...acc, cur.message_id, cur.json],
      [],
    );

    const sql = `INSERT INTO messages (message_id, json) VALUES ${placeholders}`;

    await this.dbClient.insertData(sql, values);
  }
}
