import express, { Application } from "express";
import { OpenAIProtocolLLMProvider } from "../Infrastructure/OpenAIProtocol/OpenAIProtocolLLMProvider";
import { DataRepository } from "../Infrastructure/DataRepository";
import { ErrorHandlingMiddleware } from "./middleware/ErrorHandlingMiddleware";
import { RootRouter } from "./routes/RootRouter";
import { OpenAIProtocolRouter } from "./routes/OpenAIProtocolRouter";
import { DataImportRouter } from "./routes/DataImportRouter";
import { Sqlite3DataProvider } from "../Infrastructure/Sqlite3DataProvider";
import { MemGPTProvider } from "../Infrastructure/MemGPTProvider";

class Server {
  private app: Application;
  private readonly port: number;

  constructor(port: number) {
    this.app = express();
    this.port = port;

    // Middleware
    ErrorHandlingMiddleware.SystemErrorHandle();
    ErrorHandlingMiddleware.ExpressErrorHandle(this.app);
    this.app.use(express.json());

    // Bootstrapper
    let dbClient = new Sqlite3DataProvider();
    let openAIProtocolLLMProvider = new OpenAIProtocolLLMProvider();
    let dataRepository = new DataRepository(dbClient);
    let memGPTProvider = new MemGPTProvider(dataRepository);

    // Routes
    new RootRouter(this.app);
    new OpenAIProtocolRouter(
      this.app,
      openAIProtocolLLMProvider,
      memGPTProvider,
      dataRepository,
    );
    new DataImportRouter(
      this.app,
      openAIProtocolLLMProvider,
      memGPTProvider,
      dataRepository,
    );

    this.start();
  }

  private start() {
    this.app.listen(this.port, () => {
      console.log(`Server is running on http://0.0.0.0:${this.port}`);
    });
  }
}

const port: number = 8050;

// Start the server
new Server(port);
