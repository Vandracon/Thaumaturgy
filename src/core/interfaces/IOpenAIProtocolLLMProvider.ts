import { Response } from "express";
import { LLMChatCompletionResponse } from "../Data/OpenAIProtocol/LLMChatCompletionResponse";

export interface IOpenAIProtocolLLMProvider {
  handleMessage(res: Response, originalBody: string): Promise<void>;
  chatToLLM(
    prompt: string,
    maxTokens: number,
  ): Promise<LLMChatCompletionResponse>;
}
