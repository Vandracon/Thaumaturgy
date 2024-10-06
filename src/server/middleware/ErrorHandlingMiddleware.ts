import { Application, Request, Response, NextFunction } from "express";

export class ErrorHandlingMiddleware {
  public static ExpressErrorHandle(app: Application) {
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      if (err instanceof HttpException) {
        console.error(err.stack);
        res.status(err.statusCode).json({ message: err.message });
      } else {
        // Handle generic or unknown errors
        res.status(500).json({ message: "Internal server error" });
      }
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

export class HttpException extends Error {
  public statusCode: number;
  public message: string;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;

    Object.setPrototypeOf(this, HttpException.prototype);
  }
}
