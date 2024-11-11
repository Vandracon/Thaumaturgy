import sqlite3, { Database, RunResult } from "sqlite3";
import { IDatabaseClient } from "../Core/Interfaces/IDatabaseClient";

export class Sqlite3DataProvider implements IDatabaseClient {
  private db: Database;
  private debugDB: Database | undefined;

  constructor(
    private dbPath: string,
    private debugDbPath: string | undefined,
    migrate: boolean = false,
  ) {
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log(`Connected to SQlite (${this.dbPath}) database.`);
      if (migrate) this.runMigrations();
    });

    if (this.debugDbPath) {
      this.debugDB = new sqlite3.Database(this.debugDbPath, (err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log(
          `Connected to debug SQlite (${this.debugDbPath}) database.`,
        );
        if (migrate) this.runDebugMigrations();
      });
    }
  }

  runSql(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, (err) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  createDebugTable(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.debugDB) return reject("No debug database provided");
      this.debugDB.run(sql, (err) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  insertData(sql: string, values: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, values, function (this: RunResult, err) {
        if (err) {
          reject(err);
        }
        if (this.lastID) console.log(`Query complete. lastId ${this.lastID}`);
        else console.log(`Query complete.`);
        resolve();
      });
    });
  }

  insertDebugData(sql: string, values: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.debugDB) return reject("No debug database provided");
      this.debugDB.run(sql, values, function (this: RunResult, err) {
        if (err) {
          reject(err);
        }
        if (this.lastID) console.log(`Query complete. lastId ${this.lastID}`);
        else console.log(`Query complete.`);
        resolve();
      });
    });
  }

  selectData(sql: string, fields: any[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, fields, (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve(rows);
      });
    });
  }

  closeDb(): void {
    this.db.close((err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log("Close the database connection.");
    });
  }

  private async runMigrations() {
    await this.runSql(
      "CREATE TABLE IF NOT EXISTS agents(id TEXT PRIMARY KEY, name TEXT, initial_persona_header TEXT, initial_persona TEXT)",
    );

    await this.runSql(
      "CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT, message_id INTEGER, json TEXT)",
    );

    await this.runSql(
      "CREATE TABLE IF NOT EXISTS filters(find TEXT, replace TEXT)",
    );

    console.log("Main DB Migrations Complete");
  }

  private async runDebugMigrations() {
    await this.createDebugTable(
      `CREATE TABLE IF NOT EXISTS created_personas(id INTEGER PRIMARY KEY AUTOINCREMENT, json TEXT)`,
    );

    await this.createDebugTable(
      `CREATE TABLE IF NOT EXISTS created_agents(id INTEGER PRIMARY KEY AUTOINCREMENT, json TEXT)`,
    );

    console.log("Debug DB Migrations Complete");
  }
}
