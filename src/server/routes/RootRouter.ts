import { Application, Request, Response } from "express";
import { BaseRouter } from "./BaseRouter";
import { HttpStatusCode } from "axios";
import { SystemService } from "../../Core/Services/SystemService";

export class RootRouter extends BaseRouter {
  constructor(
    private app: Application,
    private service: SystemService,
  ) {
    super();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.post(
      this.buildEndpoint("system/memgpt/restart"),
      async (req: Request, res: Response) => {
        try {
          await this.service.restartMemGPT();

          res.json({ data: {} });
        } catch (e: any) {
          res
            .status(HttpStatusCode.InternalServerError)
            .json({ data: { error: e.message } });
        }
      },
    );
  }
}
