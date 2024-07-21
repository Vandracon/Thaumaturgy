import { Application, Request, Response } from "express";
import { MemGPTModController } from "../controllers/MemGPTModController";
import { MemGPTModValidator } from "../validators/MemGPTModValidator";
import { BaseRouter } from "./BaseRouter";
import { UpdateAgentLLMConfig } from "../../Core/Data/MemGPT/Mod/UpdateAgentLLMConfig";
import { HttpStatusCode } from "axios";
import { IMemGPTMod } from "../../Infrastructure/MemGPTMod";
import { UpdateAllAgentLLMConfig } from "../../Core/Data/MemGPT/Mod/UpdateAllAgentLLMConfig";
import { UpdateAgentSystemPromptData } from "../../Core/Data/MemGPT/Mod/UpdateAgentSystemPromptData";
import { UpdateAllAgentsSystemPromptData } from "../../Core/Data/MemGPT/Mod/UpdateAllAgentsSystemPromptData";

export class MemGPTModRouter extends BaseRouter {
  private controller: MemGPTModController;
  private validator: MemGPTModValidator;

  constructor(
    private app: Application,
    private memGPTMod: IMemGPTMod,
  ) {
    super();
    this.controller = new MemGPTModController(this.memGPTMod);
    this.validator = new MemGPTModValidator();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.app.post(
      this.buildEndpoint("mod/agent/llmconfig"),
      async (req: Request, res: Response) => {
        try {
          let body = req.body as UpdateAgentLLMConfig;

          let results = this.validator.validateUpdateAgentLLMConfig(body);

          if (!results.passed) {
            res.status(HttpStatusCode.BadRequest).send({ data: results.data });
            return;
          }

          await this.controller.updateAgentLLMConfig(body);

          res.json({ data: {} });
        } catch (e: any) {
          res
            .status(HttpStatusCode.InternalServerError)
            .json({ data: { error: e.message } });
        }
      },
    );

    this.app.post(
      this.buildEndpoint("mod/agents/llmconfig"),
      async (req: Request, res: Response) => {
        try {
          let body = req.body as UpdateAllAgentLLMConfig;

          let results = this.validator.validateUpdateAgentsLLMConfig(body);

          if (!results.passed) {
            res.status(HttpStatusCode.BadRequest).send({ data: results.data });
            return;
          }

          await this.controller.updateAllAgentsLLMConfig(body);

          res.json({ data: {} });
        } catch (e: any) {
          res
            .status(HttpStatusCode.InternalServerError)
            .json({ data: { error: e.message } });
        }
      },
    );

    this.app.post(
      this.buildEndpoint("mod/agent/system"),
      async (req: Request, res: Response) => {
        try {
          let body = req.body as UpdateAgentSystemPromptData;

          let results = this.validator.validateUpdateAgentSystem(body);

          if (!results.passed) {
            res.status(HttpStatusCode.BadRequest).send({ data: results.data });
            return;
          }

          await this.controller.updateAgentBaseSystemPrompt(body);

          res.json({ data: {} });
        } catch (e: any) {
          res
            .status(HttpStatusCode.InternalServerError)
            .json({ data: { error: e.message } });
        }
      },
    );

    this.app.post(
      this.buildEndpoint("mod/agents/system"),
      async (req: Request, res: Response) => {
        try {
          let body = req.body as UpdateAllAgentsSystemPromptData;

          let results = this.validator.validateUpdateAllAgentsSystem(body);

          if (!results.passed) {
            res.status(HttpStatusCode.BadRequest).send({ data: results.data });
            return;
          }

          await this.controller.updateAllAgentsBaseSystemPrompt(body);

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
