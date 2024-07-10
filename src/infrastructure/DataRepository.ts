import { Agent } from "../core/entities/Agent";
import { IDataRepository } from "../core/interfaces/IDataRepository";
import { Sqlite3DataProvider } from "./Sqlite3DataProvider";

export class DataRepository implements IDataRepository {
  private databaseClient: Sqlite3DataProvider;

  constructor() {
    this.databaseClient = new Sqlite3DataProvider();
  }
  async getAgentByName(name: string): Promise<Array<Agent>> {
    return this.databaseClient.selectData(
      `SELECT * FROM agents WHERE name = ?`,
      [name],
    );
  }
}
