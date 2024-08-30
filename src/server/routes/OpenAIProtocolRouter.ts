import { Application, Request, Response } from "express";
import { OpenAIProtocolService } from "../../Core/Services/OpenAIProtocolService";
import { BaseRouter } from "./BaseRouter";
import { IOpenAIProtocolLLMProvider } from "../../Core/Interfaces/IOpenAIProtocolLLMProvider";
import { IMemGPTProvider } from "../../Core/Interfaces/IMemGPTProvider";
import { IDataRepository } from "../../Core/Interfaces/IDataRepository";
import { IDataImportFileProcessor } from "../../Core/Interfaces/Importer/IDataImportFileProcessor";

export class OpenAIProtocolRouter extends BaseRouter {
  private openAIProtocolService: OpenAIProtocolService;

  constructor(
    private app: Application,
    private openAIProtocolLLMProvider: IOpenAIProtocolLLMProvider,
    private memGPTProvider: IMemGPTProvider,
    private dataRepository: IDataRepository,
    private dataImportFileProcessor: IDataImportFileProcessor,
  ) {
    super();
    this.setupRoutes();

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
  }
}
