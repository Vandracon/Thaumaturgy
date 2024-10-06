import express, { Application } from "express";
import path from "path";

export class WebAppRouter {
  constructor(private app: Application) {
    this.setupRoutes();
  }

  private setupRoutes(): void {
    const uiPath = `${process.cwd()}/src/Server/webapp`;

    // Serve static files from the React app
    this.app.use(express.static(path.join(uiPath, "build")));

    // Catch all requests and send them to React's index.html
    this.app.get("*", (req, res) => {
      res.sendFile(path.join(uiPath, "build", "index.html"));
    });
  }
}
