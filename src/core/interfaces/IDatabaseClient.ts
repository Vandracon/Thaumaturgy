import { RunResult } from "sqlite3";

export interface IDatabaseClient {
  runSql(sql: string): Promise<void>;
  createDebugTable(sql: string): Promise<void>;
  insertData(sql: string, values: any[]): Promise<void>;
  insertDebugData(sql: string, values: any[]): Promise<void>;
  selectData(sql: string, fields: any[]): Promise<any[]>;
  closeDb(): void;
}
