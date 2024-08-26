import { Request, Response } from "express";
import { IOpenAIProtocolService } from "../Interfaces/IOpenAIProtocolService";
import { IOpenAIProtocolLLMProvider } from "../Interfaces/IOpenAIProtocolLLMProvider";
import { IMemGPTProvider } from "../Interfaces/IMemGPTProvider";
import { IDataRepository } from "../Interfaces/IDataRepository";
import { ThaumaturgyAgent } from "../Entities/Agent";
import { LLMChatRequestMessageBody } from "../Data/OpenAIProtocol/LLMChatRequestMessageBody";
import { Validator } from "../Validators/Validator";
import { performance } from "perf_hooks";
import { Bootstraper } from "../../Server/Bootstrapper";
import { IThaumicRequest, ThaumicIntent } from "../Data/ThaumicRequest";
import { Utility } from "../Utils/Utility";
import * as config from "config";

export class OpenAIProtocolService implements IOpenAIProtocolService {
  constructor(
    private openAIProtocolLLMProvider: IOpenAIProtocolLLMProvider,
    private memGPTProvider: IMemGPTProvider,
    private dataRepository: IDataRepository,
  ) {}

  async handleMessage(req: Request, res: Response): Promise<void> {
    if (req.body.messages.length > 0) {
      req.body.messages = Validator.removeEmptyContent(req.body.messages);
    }

    let originalBody = JSON.stringify(req.body);
    console.log("Incoming /v1/chat/completions", originalBody);

    let agents: Array<ThaumaturgyAgent> | null = [];
    let hasSystemPromptForMemGPT = false;
    let dynamicData = "";
    let playerUserIncluded = false;
    let intent: ThaumicIntent = ThaumicIntent.ONE_ON_ONE;
    let maxTokens = req.body.max_tokens;
    let systemMessageBody: LLMChatRequestMessageBody = {
      message: "",
      role: "system",
      stream: false,
    };
    let userMessageBody: LLMChatRequestMessageBody = {
      message: "",
      role: "user",
      stream: false,
    };

    for (let msg of req.body.messages) {
      if (msg.role == "system") {
        let sys = await this.processSystemMessage(msg.content);
        agents = sys.agents;
        msg.content = sys.updated_system_prompt;
        playerUserIncluded = sys.player_user_included || false;
        intent = sys.intent || ThaumicIntent.ONE_ON_ONE;
        if (msg.content && msg.content.length > 0) {
          hasSystemPromptForMemGPT = true;
          systemMessageBody.message = msg.content;
        } else {
          msg.content = sys.fallback_prompt;
          systemMessageBody.message = sys.fallback_prompt;
        }
      } else if (msg.role == "user") {
        let usrMsg = await this.processUserMessage(msg.content);
        msg.content = (dynamicData.length ? dynamicData + " " : "") + usrMsg;
        userMessageBody.message = msg.content;
      }
    }

    // Set the appropriate headers
    if (req.body.stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Transfer-Encoding", "chunked");
    } else {
      res.setHeader("Content-Type", "application/json");
    }

    let startTime = performance.now();

    if (agents && intent == ThaumicIntent.ONE_ON_ONE) {
      console.log("Handling one on one message");
      await this.memGPTProvider.handleOneOnOneMessage(
        res,
        hasSystemPromptForMemGPT,
        agents[0].id,
        systemMessageBody,
        userMessageBody,
      );
    } else if (agents && intent == ThaumicIntent.GROUP_CONVERSATION) {
      console.log("Handling group message");
      if (!maxTokens) {
        console.warn(
          `Max tokens not provided in request, using default ${config.LLM.FALLBACK_MAX_TOKENS}`,
        );
        maxTokens = config.LLM.FALLBACK_MAX_TOKENS;
      }
      await this.memGPTProvider.handleGroupMessage(
        res,
        hasSystemPromptForMemGPT,
        agents,
        systemMessageBody,
        userMessageBody,
        originalBody,
        playerUserIncluded,
        maxTokens,
      );
    } else if (
      intent == ThaumicIntent.SUMMARIZE &&
      this.memGPTProvider.isInGroupConversation()
    ) {
      console.log("Handling group summary message");
      // Do normal LLM request for the summary.
      await this.openAIProtocolLLMProvider.handleMessage(res, originalBody);

      // End convo / notify MemGPT agents of any updates from the convo.
      await this.memGPTProvider.endGroupConversation(
        //hasSystemPromptForMemGPT,
        //systemMessageBody,
        //userMessageBody,
        originalBody,
        //playerUserIncluded,
        //maxTokens,
      );
    } else {
      console.log("Using LLM directly");
      Bootstraper.getAudioPlayer().playLLMBeep(0.05);

      // If no agentId was found. Fallback to using the LLM directly
      await this.openAIProtocolLLMProvider.handleMessage(res, originalBody);
    }

    let endTime = performance.now();

    console.log(
      `Function execution took ${(endTime - startTime) / 1000} seconds.`,
    );
  }

  private parseCustomPrompt(msg: string): IThaumicRequest {
    let msgData = msg.split("|=|");

    let isThaumic = msgData.length > 1;
    let intent = Number(msgData[0]);
    let uids: string[] = [];
    let thaumicSystemPrompt = "";
    let fallback_prompt = "";

    if (intent == ThaumicIntent.ONE_ON_ONE) {
      uids = [msgData[1]];
      fallback_prompt = msgData[2];
    } else if (intent == ThaumicIntent.GROUP_CONVERSATION) {
      // Parse the list of agent uids (names)
      uids = Utility.convertStringNameFormatToArrayOfNames(msgData[1]);
      thaumicSystemPrompt = msgData[2];
      fallback_prompt = msgData[3];
    } else if (intent == ThaumicIntent.SUMMARIZE) {
      uids = [msgData[1]];
      fallback_prompt = msgData[2];
    }

    return {
      is_thaumic: isThaumic,
      intent: Number(msgData[0]),
      uids: uids,
      thaumicSystemPrompt: thaumicSystemPrompt,
      fallback_prompt: fallback_prompt,
    };
  }

  private async processUserMessage(msg: string) {
    return msg;
  }

  private async processSystemMessage(msg: string) {
    let msgData = this.parseCustomPrompt(msg);

    if (msgData.is_thaumic) {
      let agents: Array<ThaumaturgyAgent> = [];
      let playerUserIncluded = false;

      let fails = 0;
      for (const [index, uid] of msgData.uids.entries()) {
        let tAgentRes = await this.dataRepository.getAgentByName(uid);

        if (tAgentRes.length == 0) {
          if (index === msgData.uids.length - 1) {
            // If it could not be found and is last index. Likely it is the named player.
            playerUserIncluded = true;
            continue;
          }

          console.warn(`Could not find NPC by the name of ${uid}`);
          Bootstraper.getAudioPlayer().playNoNPCFoundBeep();
          fails++;
          continue;
        }
        if (tAgentRes.length > 1) {
          console.warn(
            "Query for NPC returned more than one result. Using first.. but this is a problem.",
          );
        }

        agents.push(
          new ThaumaturgyAgent(
            tAgentRes[0].id,
            tAgentRes[0].name,
            tAgentRes[0].initial_persona_header,
            tAgentRes[0].initial_persona,
          ),
        );
        console.log(
          `Found NPC data for ${tAgentRes[0].name} ID: ${tAgentRes[0].id}`,
        );
      }

      return {
        agents: agents.length ? agents : null,
        intent: msgData.intent,
        updated_system_prompt: msgData.thaumicSystemPrompt
          ? msgData.thaumicSystemPrompt
          : "",
        fallback_prompt: msgData.fallback_prompt,
        player_user_included: playerUserIncluded,
      };
    } else {
      return {
        agents: null,
        fallback_prompt: msg,
      };
    }
  }
}
