import { Response } from "express";

export interface IOpenAIProtocolLLMProvider {
  handleMessage(res: Response, originalBody: string): Promise<void>;
}
