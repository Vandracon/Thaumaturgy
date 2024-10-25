import { Response } from "express";
import { LLMChatCompletionResponse } from "../Data/OpenAIProtocol/LLMChatCompletionResponse";
import { Message } from "../Data/OpenAIProtocol/LLMChatCompletionRequestBody";

export interface IOpenAIProtocolLLMProvider {
  handleMessage(res: Response, originalBody: string): Promise<void>;
  simpleUserRequestToLLM(
    systemPrompt: string | null,
    userPrompt: string | null,
    maxTokens: number,
    model: string | null,
    frequency_penalty: number,
    stop: any,
    temperature: number,
    top_p: number,
  ): Promise<LLMChatCompletionResponse>;
  sendToLLM(
    messages: Array<Message>,
    maxTokens: number,
    model: string | null,
    frequency_penalty: number,
    stop: any,
    temperature: number,
    top_p: number,
  ): Promise<LLMChatCompletionResponse>;
}
