import express, { Application } from "express";
import { RootRouter } from "./routes/RootRouter";
import { ErrorHandlingMiddleware } from "./middleware/ErrorHandlingMiddleware";
import { OpenAIProtocolRouter } from "./routes/OpenAIProtocolRouter";

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

    // Routes
    new RootRouter(this.app);
    new OpenAIProtocolRouter(this.app);

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
