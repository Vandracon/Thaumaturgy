import { Application, Request, Response } from "express";
import { OpenAIProtocolService } from "../../core/services/OpenAIProtocolService";
import { OpenAIProtocolLLMProvider } from "../../infrastructure/OpenAIProtocolLLMProvider";
import { MemGPTProvider } from "../../infrastructure/MemGPTProvider";
import { DataRepository } from "../../infrastructure/DataRepository";

export class OpenAIProtocolRouter {
  private openAIProtocolService: OpenAIProtocolService;

  constructor(private app: Application) {
    this.setupRoutes();

    // Bootstrapper
    let openAIProtocolLLMProvider = new OpenAIProtocolLLMProvider();
    let memGPTProvider = new MemGPTProvider();
    let dataRepository = new DataRepository();

    this.openAIProtocolService = new OpenAIProtocolService(
      openAIProtocolLLMProvider,
      memGPTProvider,
      dataRepository,
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
