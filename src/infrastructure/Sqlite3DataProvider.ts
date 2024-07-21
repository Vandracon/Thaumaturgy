import sqlite3, { Database, RunResult } from "sqlite3";
import { IDatabaseClient } from "../Core/Interfaces/IDatabaseClient";

export class Sqlite3DataProvider implements IDatabaseClient {
  private db: Database;
  private debugDB: Database | undefined;

  constructor(
    private dbPath: string,
    private debugDbPath: string | undefined,
  ) {
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log(`Connected to SQlite (${this.dbPath}) database.`);
    });

    if (this.debugDbPath) {
      this.debugDB = new sqlite3.Database(this.debugDbPath, (err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log(`Connected to debug SQlite (${this.dbPath}) database.`);
      });
    }
  }

  createTable(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, (err) => {
        if (err) {
          reject(err);
        }
        console.log("Table created.");
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
        console.log("Table created.");
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
        console.log(`Query complete. rowid ${this.lastID}`);
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
        console.log(`Query complete. rowid ${this.lastID}`);
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
        rows.forEach((row: any) => {
          console.log(row.message);
        });
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
}
