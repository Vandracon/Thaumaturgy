import { Response } from "express";
import { ProcessedBio } from "../Data/Importer/ProcessedBio";
import { LLMChatRequestMessageBody } from "../Data/OpenAIProtocol/LLMChatRequestMessageBody";
import { Preset } from "../Entities/Preset";
import { Agent, ThaumaturgyAgent } from "../Entities/Agent";

export interface IMemGPTProvider {
  handleMessage(
    res: Response,
    hasSystemPrompt: boolean,
    agentId: string,
    systemMessageBody: LLMChatRequestMessageBody,
    userMessageBody: LLMChatRequestMessageBody,
  ): Promise<void>;

  createPersonas(bios: Array<ProcessedBio>): Promise<Array<any>>;

  createUserTemplate(
    userTemplateName: string,
    userTemplate: string,
  ): Promise<void>;

  createPreset(preset: Preset): Promise<void>;

  createAgents(agents: Array<Agent>): Promise<Array<any>>;
}
