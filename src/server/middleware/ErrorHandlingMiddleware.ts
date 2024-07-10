import { Application, Request, Response, NextFunction } from "express";

export class ErrorHandlingMiddleware {
  public static ExpressErrorHandle(app: Application) {
    app.use((err: Error, _: Request, res: Response, next: NextFunction) => {
      console.error(err.stack);
      res.status(500).send("The cauldron bubbled over! (Internal Error)");
    });
  }

  public static SystemErrorHandle() {
    process.on("uncaughtException", (err: Error) => {
      console.error("There was an uncaught error", err);
    });

    process.on(
      "unhandledRejection",
      (reason: {} | null | undefined, promise: Promise<any>) => {
        console.error("Unhandled Rejection at:", promise, "reason:", reason);
      },
    );
  }
}
