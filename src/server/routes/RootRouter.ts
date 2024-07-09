import { Application, Request, Response } from "express";

export class RootRouter {
  constructor(private app: Application) {
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.get("/", (req: Request, res: Response) => {
      // Send a response to the client
      res.send("Hello, TypeScript + Node.js + Express!");
    });
  }
}
