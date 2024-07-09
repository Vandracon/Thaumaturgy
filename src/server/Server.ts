import express, { Application } from "express";
import { RootRouter } from "./routes/RootRouter";

class Server {
  private app: Application;
  private readonly port: number;

  constructor(port: number) {
    this.app = express();
    this.port = port;

    new RootRouter(this.app);

    this.start();
  }

  private start() {
    this.app.listen(this.port, () => {
      console.log(`Server is running on http://0.0.0.0:${this.port}`);
    });
  }
}

// The port the express app will listen on
const port: number = 8050;

// Start the server
new Server(port);
