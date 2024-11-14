import { Response } from "express";
import { ProcessedBio } from "../Data/Importer/ProcessedBio";
import { LLMChatRequestMessageBody } from "../Data/OpenAIProtocol/LLMChatRequestMessageBody";
import { Preset } from "../Entities/Preset";
import { Agent, ThaumaturgyAgent } from "../Entities/Agent";
import { CoreMemoryResponse } from "../Data/MemGPT/CoreMemory";
import { ChatHistory } from "../Data/Agents/ChatHistoryRequest";

export interface IMemGPTProvider {
  handleOneOnOneMessage(
    res: Response,
    hasSystemPrompt: boolean,
    agentId: string,
    systemMessageBody: LLMChatRequestMessageBody,
    userMessageBody: LLMChatRequestMessageBody,
  ): Promise<void>;

  handleGroupMessage(
    res: Response,
    hasSystemPrompt: boolean,
    agents: Array<ThaumaturgyAgent>,
    systemMessageBody: LLMChatRequestMessageBody,
    userMessageBody: LLMChatRequestMessageBody,
    originalBody: string,
    playerUserIncluded: boolean,
    maxTokens: number,
  ): Promise<void>;

  isInGroupConversation(): boolean;

  endGroupConversation(
    //hasSystemPrompt: boolean,
    //systemMessageBody: LLMChatRequestMessageBody,
    //userMessageBody: LLMChatRequestMessageBody,
    originalBody: string,
    //playerUserIncluded: boolean,
    //maxTokens: number,
  ): Promise<void>;

  createPersonas(bios: Array<ProcessedBio>): Promise<Array<any>>;

  createUserTemplate(
    userTemplateName: string,
    userTemplate: string,
    domain: string,
  ): Promise<void>;

  createPreset(preset: Preset): Promise<void>;

  createAgents(agents: Array<Agent>, systemPrompt: string): Promise<Array<any>>;

  getCoreMemory(agentId: string): Promise<CoreMemoryResponse>;

  updateCoreMemory(
    agentId: string,
    human: string,
    persona: string,
  ): Promise<void>;

  addToArchivalMemory(agentId: string, content: string): Promise<void>;

  sendNonStreamingMessage(agentId: string, message: string): Promise<any>;
}
