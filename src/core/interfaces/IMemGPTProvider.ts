import { Response } from "express";
import { LLMChatRequestMessageBody } from "../data/open_ai_protocol/LLMChatRequestMessageBody";

export interface IMemGPTProvider {
  handleMessage(
    res: Response,
    hasSystemPrompt: boolean,
    agentId: string,
    systemMessageBody: LLMChatRequestMessageBody,
    userMessageBody: LLMChatRequestMessageBody,
  ): Promise<void>;
}
