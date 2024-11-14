import { Application, Request, Response } from "express";
import { BaseRouter } from "./BaseRouter";
import { PagingRequest } from "../../Core/Data/PagingRequest";
import { AgentsValidator } from "../validators/AgentsValidator";
import { HttpStatusCode } from "axios";
import { AgentController } from "../controllers/AgentController";
import { IDataRepository } from "../../Core/Interfaces/IDataRepository";
import { IMemGPTMod } from "../../Infrastructure/MemGPT/MemGPTMod";
import { IMemGPTProvider } from "../../Core/Interfaces/IMemGPTProvider";
import { UpdateAgentMemoryRequest } from "../../Core/Data/Agents/UpdateAgentMemoryRequest";
import { CreateAgentRequest } from "../../Core/Data/Agents/CreateAgentRequest";
import { Utility } from "../../Core/Utils/Utility";
import { ChatRequest } from "../../Core/Data/Agents/ChatRequest";

export class AgentsRouter extends BaseRouter {
  private controller: AgentController;
  private validator: AgentsValidator;

  constructor(
    private app: Application,
    dataRepository: IDataRepository,
    memGPTMod: IMemGPTMod,
    memGPTProvider: IMemGPTProvider,
  ) {
    super();
    this.controller = new AgentController(
      memGPTMod,
      memGPTProvider,
      dataRepository,
    );
    this.validator = new AgentsValidator();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.get(
      this.buildEndpoint("agents"),
      async (req: Request, res: Response) => {
        try {
          let query = req.query as unknown as PagingRequest;

          let results = this.validator.validatePagingRequest(query);

          if (!results.passed) {
            res.status(HttpStatusCode.BadRequest).send({ data: results.data });
            return;
          }

          let data = await this.controller.getAgents(
            query.page,
            query.pageSize,
          );

          res.json(data);
        } catch (e: any) {
          res
            .status(HttpStatusCode.InternalServerError)
            .json({ data: { error: e.message } });
        }
      },
    );

    this.app.get(
      this.buildEndpoint("agents/:id"),
      async (req: Request, res: Response) => {
        try {
          let guid = req.params.id;

          let data = await this.controller.getAgentDetails(guid);

          if (data != null) {
            res.json(JSON.parse(data.state));
          } else {
            res.status(HttpStatusCode.NotFound);
            res.end();
          }
        } catch (e: any) {
          console.log(e);
          res
            .status(HttpStatusCode.InternalServerError)
            .json({ data: { error: e.message } });
        }
      },
    );

    this.app.patch(
      this.buildEndpoint("agents/:id/memory"),
      async (req: Request, res: Response) => {
        try {
          let guid = req.params.id;

          let results = this.validator.validateAgentMemoryUpdateRequest(
            req.params.id,
            req.body as UpdateAgentMemoryRequest,
          );

          if (!results.passed) {
            res.status(HttpStatusCode.BadRequest).send({ data: results.data });
            return;
          }

          await this.controller.updateAgentMemory(
            guid,
            req.body.human,
            req.body.persona,
            req.body.model,
          );

          res.json({});
        } catch (e: any) {
          console.log(e);
          res
            .status(HttpStatusCode.InternalServerError)
            .json({ data: { error: e.message } });
        }
      },
    );

    this.app.post(
      this.buildEndpoint("agents"),
      async (req: Request, res: Response) => {
        try {
          let results = this.validator.validateCreateAgentRequest(
            req.body as CreateAgentRequest,
          );

          if (!results.passed) {
            res.status(HttpStatusCode.BadRequest).send({ data: results.data });
            return;
          }

          let data = await this.controller.createAgent(req.body);

          res.json(data);
        } catch (e: any) {
          Utility.routerLevelExceptionHandler(e, res);
        }
      },
    );

    this.app.post(
      this.buildEndpoint("agent/:id/chat"),
      async (req: Request, res: Response) => {
        try {
          let agentId = req.params.id;
          let data = req.body as ChatRequest;
          let results = this.validator.validateConversationRequest(data);

          if (!results.passed) {
            res.status(HttpStatusCode.BadRequest).send({ data: results.data });
            return;
          }

          let response = await this.controller.chatToAgent(agentId, data);

          res.json(response);
        } catch (e: any) {
          Utility.routerLevelExceptionHandler(e, res);
        }
      },
    );
  }
}
