import { Application, Request, Response } from "express";
import { OpenAIProtocolService } from "../../Core/Services/OpenAIProtocolService";
import { BaseRouter } from "./BaseRouter";
import { IOpenAIProtocolLLMProvider } from "../../Core/Interfaces/IOpenAIProtocolLLMProvider";
import { IMemGPTProvider } from "../../Core/Interfaces/IMemGPTProvider";
import { IDataRepository } from "../../Core/Interfaces/IDataRepository";
import { IDataImportFileProcessor } from "../../Core/Interfaces/Importer/IDataImportFileProcessor";
import { HttpStatusCode } from "axios";
import { SetFilteringData } from "../../Core/Data/OpenAIProtocol/SetFilteringData";
import { OpenAIProtocolValidator } from "../validators/OpenAIProtocolValidator";

export class OpenAIProtocolRouter extends BaseRouter {
  private openAIProtocolService: OpenAIProtocolService;
  private validator: OpenAIProtocolValidator;

  constructor(
    private app: Application,
    private openAIProtocolLLMProvider: IOpenAIProtocolLLMProvider,
    private memGPTProvider: IMemGPTProvider,
    private dataRepository: IDataRepository,
    private dataImportFileProcessor: IDataImportFileProcessor,
  ) {
    super();
    this.setupRoutes();
    this.validator = new OpenAIProtocolValidator();

    this.openAIProtocolService = new OpenAIProtocolService(
      this.openAIProtocolLLMProvider,
      this.memGPTProvider,
      this.dataRepository,
      this.dataImportFileProcessor,
    );
  }

  private setupRoutes(): void {
    this.app.post(
      "/v1/chat/completions",
      async (req: Request, res: Response) => {
        this.openAIProtocolService.handleMessage(req, res);
      },
    );

    this.app.post(
      this.buildEndpoint("filtering"),
      async (req: Request, res: Response) => {
        try {
          let body = req.body as SetFilteringData;

          let results = this.validator.validateSetFiltering(body);

          if (!results.passed) {
            res.status(HttpStatusCode.BadRequest).send({ data: results.data });
            return;
          }

          await this.openAIProtocolService.setFiltering(body.data);

          res.json({ data: {} });
        } catch (e: any) {
          console.log("broke", e);

          res
            .status(HttpStatusCode.InternalServerError)
            .json({ data: { error: e.message } });
        }
      },
    );

    this.app.get(
      this.buildEndpoint("filtering"),
      async (req: Request, res: Response) => {
        try {
          let data = await this.openAIProtocolService.getFiltering();

          res.json({ data });
        } catch (e: any) {
          res
            .status(HttpStatusCode.InternalServerError)
            .json({ data: { error: e.message } });
        }
      },
    );
  }
}
