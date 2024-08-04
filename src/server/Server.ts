import express, { Application } from "express";
import { OpenAIProtocolLLMProvider } from "../Infrastructure/OpenAIProtocol/OpenAIProtocolLLMProvider";
import { DataRepository } from "../Infrastructure/DataRepository";
import { ErrorHandlingMiddleware } from "./middleware/ErrorHandlingMiddleware";
import { RootRouter } from "./routes/RootRouter";
import { OpenAIProtocolRouter } from "./routes/OpenAIProtocolRouter";
import { DataImportRouter } from "./routes/DataImportRouter";
import { Sqlite3DataProvider } from "../Infrastructure/Sqlite3DataProvider";
import { MemGPTProvider } from "../Infrastructure/MemGPTProvider";
import { MemGPTModRouter } from "./routes/MemGPTModRouter";
import { MemGPTMod } from "../Infrastructure/MemGPTMod";
import * as config from "config";
import { temporaryFileRemover } from "./middleware/TempFileRemover";
import { Bootstraper } from "./Bootstrapper";
import { SoundPlayAudioPlayer } from "../Infrastructure/SoundPlayAudioPlayer";

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
    this.app.use(temporaryFileRemover);

    // Bootstrapper
    Bootstraper.init(new SoundPlayAudioPlayer());
    let thaumaturgyDbClient = new Sqlite3DataProvider(
      process.cwd() + "/local/thaumaturgy.db",
      process.cwd() + "/local/thaumaturgydebug.db",
    );
    let memGPTDbClient = new Sqlite3DataProvider(
      config.MEMGPT.MOD.MEMGPT_SQLITE_DATABASE_PATH,
      undefined,
    );
    let openAIProtocolLLMProvider = new OpenAIProtocolLLMProvider();
    let thaumaturgyDataRepository = new DataRepository(thaumaturgyDbClient);
    let memGPTProvider = new MemGPTProvider(thaumaturgyDataRepository);
    let memGPTMod = new MemGPTMod(memGPTDbClient);

    // Routes
    new RootRouter(this.app);
    new OpenAIProtocolRouter(
      this.app,
      openAIProtocolLLMProvider,
      memGPTProvider,
      thaumaturgyDataRepository,
    );
    new DataImportRouter(
      this.app,
      openAIProtocolLLMProvider,
      memGPTProvider,
      thaumaturgyDataRepository,
    );
    new MemGPTModRouter(this.app, memGPTMod);

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
