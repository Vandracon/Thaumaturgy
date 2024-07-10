import { Request, Response } from "express";

export interface IOpenAIProtocolService {
  handleMessage(req: Request, res: Response): Promise<void>;
}
