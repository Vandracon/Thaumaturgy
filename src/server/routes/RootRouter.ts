import { Application, Request, Response } from "express";

export class RootRouter {
  constructor(private app: Application) {
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.get("/", (req: Request, res: Response) => {
      // Send a response to the client
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    background-color: #800080;
                    margin: 0;
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                }

                h1 {
                    font-family: 'Comic Sans MS', cursive, sans-serif;
                    color: #D300C5; /* A brighter shade of purple */
                    font-size: 4em;
                    margin: 0;
                }

                h2 {
                    font-family: 'Comic Sans MS', cursive, sans-serif;
                    color: #76B041; /* A greenish color that fits the purple */
                    font-size: 1em;
                    margin: 0;
                }
            </style>
        </head>
        <body>
            <h1>Thaumaturgy</h1>
            <h2>We bring shit to life</h2>
        </body>
        </html>
      `);
    });
  }
}
