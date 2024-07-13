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

  async saveCreatedPersonasAnalytics(
    personaCreateResponses: Array<any>,
  ): Promise<void> {
    await this.dbClient.createDebugTable(
      `CREATE TABLE IF NOT EXISTS created_personas(id INTEGER PRIMARY KEY AUTOINCREMENT, json TEXT)`,
    );

    const placeholders = personaCreateResponses.map(() => "(?)").join(", ");
    const values = personaCreateResponses.reduce(
      (acc, cur) => [...acc, JSON.stringify(cur)],
      [],
    );

    const sql = `INSERT INTO created_personas (json) VALUES ${placeholders}`;
    await this.dbClient.insertDebugData(sql, values);
  }

  async saveCreatedAgentsAnalytics(createdAgentsResponses: Array<any>) {
    await this.dbClient.createDebugTable(
      `CREATE TABLE IF NOT EXISTS created_agents(id INTEGER PRIMARY KEY AUTOINCREMENT, json TEXT)`,
    );

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
    await this.dbClient.createTable(
      "CREATE TABLE IF NOT EXISTS agents(id TEXT PRIMARY KEY, name TEXT, persona TEXT)",
    );

    let insert: any = [];
    for (let agent of agents) {
      insert.push({
        id: agent.id,
        name: agent.name,
        persona: agent.persona,
      });
    }

    const placeholders = insert.map(() => "(?, ?, ?)").join(", ");
    const values = insert.reduce(
      (acc: any, cur: any) => [...acc, cur.id, cur.name, cur.persona],
      [],
    );

    const sql = `INSERT INTO agents (id, name, persona) VALUES ${placeholders}`;

    await this.dbClient.insertData(sql, values);
  }
}
