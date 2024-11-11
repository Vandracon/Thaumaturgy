import { Request, Response } from "express";
import { IOpenAIProtocolService } from "../Interfaces/IOpenAIProtocolService";
import { IOpenAIProtocolLLMProvider } from "../Interfaces/IOpenAIProtocolLLMProvider";
import { IMemGPTProvider } from "../Interfaces/IMemGPTProvider";
import { IDataRepository } from "../Interfaces/IDataRepository";
import { Agent, ThaumaturgyAgent } from "../Entities/Agent";
import { LLMChatRequestMessageBody } from "../Data/OpenAIProtocol/LLMChatRequestMessageBody";
import { Validator } from "../Validators/Validator";
import { performance } from "perf_hooks";
import { Bootstraper } from "../../Server/Bootstrapper";
import { IThaumicRequest, ThaumicIntent } from "../Data/ThaumicRequest";
import { Utility } from "../Utils/Utility";
import * as config from "config";
import { IDataImportFileProcessor } from "../Interfaces/Importer/IDataImportFileProcessor";
import { Filter } from "../Entities/Filter";
import { GetFilteringResponse } from "../Data/OpenAIProtocol/GetFilteringResponse";

export class OpenAIProtocolService implements IOpenAIProtocolService {
  private filters: Array<Filter> = [];
  public static FiltersDirty: boolean = true;
  constructor(
    private openAIProtocolLLMProvider: IOpenAIProtocolLLMProvider,
    private memGPTProvider: IMemGPTProvider,
    private dataRepository: IDataRepository,
    private dataImportFileProcessor: IDataImportFileProcessor,
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
    let intent: ThaumicIntent = ThaumicIntent.UNKNOWN;
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

    // Ensure latest filters are loaded
    if (OpenAIProtocolService.FiltersDirty) {
      this.filters = (await this.dataRepository.getFiltering()).filters;
      OpenAIProtocolService.FiltersDirty = false;
    }

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

        if (this.filters.length) {
          console.log(
            `Applying filter to user message. BEFORE: ${msg.content}`,
          );
          userMessageBody.message = this.applyFilterToMessage(msg.content);
          console.log(
            `Applying filter to user message. AFTER: ${userMessageBody.message}`,
          );
        } else {
          userMessageBody.message = msg.content;
        }
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
          if (index === msgData.uids.length - 1 && msgData.uids.length > 1) {
            // If it could not be found and is last index of a list of more than 1 npc target to speak to... Likely it is the named player.
            playerUserIncluded = true;
            continue;
          }

          console.warn(
            `Could not find NPC by the name of ${uid}. Checking fallback methods`,
          );

          //#region Create new NPC from characters file
          let processedBio = null;

          try {
            processedBio =
              await this.dataImportFileProcessor.getProcessedBioFromCharactersCSVData(
                uid,
              );
          } catch (e) {
            console.warn(
              "The agent to create will be basic with no specific personality to start with.",
            );
          }

          if (processedBio) {
            let agent = new Agent(
              processedBio.name,
              `${config.THAUMATURGY.DOMAIN}_character`,
              `${config.THAUMATURGY.HUMAN_STARTER_MEMORY}`,
              processedBio.name,
              processedBio.persona_header + processedBio.persona,
              config.LLM.MODEL_NAME,
              config.MEMGPT.FUNCTIONS_SCHEMA,
            );

            let systemPrompt = Utility.getSystemPromptSync();

            let createAgentResponses = await this.memGPTProvider.createAgents(
              [agent],
              systemPrompt,
            );

            await this.dataRepository.saveCreatedAgentsAnalytics(
              createAgentResponses,
            );

            tAgentRes = [
              new ThaumaturgyAgent(
                createAgentResponses[0].agent_state.id,
                createAgentResponses[0].agent_state.name,
                processedBio.persona_header,
                processedBio.persona,
              ),
            ];
            //#endregion
          } else {
            //#region Fallback to create basic agent as last resort
            console.warn(
              `Unable to create agent from characters CSV, creating agent with basic info`,
            );

            let agent = new Agent(
              uid,
              `${config.THAUMATURGY.DOMAIN}_character`,
              `${config.THAUMATURGY.HUMAN_STARTER_MEMORY}`,
              "memgpt_starter",
              config.THAUMATURGY.UNKNOWN_AGENT_CREATION_PERSONA,
              config.LLM.MODEL_NAME,
              config.MEMGPT.FUNCTIONS_SCHEMA,
            );

            let systemPrompt = Utility.getSystemPromptSync();

            let createAgentResponses = await this.memGPTProvider.createAgents(
              [agent],
              systemPrompt,
            );

            tAgentRes = [
              new ThaumaturgyAgent(
                createAgentResponses[0].agent_state.id,
                createAgentResponses[0].agent_state.name,
                "",
                config.THAUMATURGY.UNKNOWN_AGENT_CREATION_PERSONA,
              ),
            ];
            //#endregion
          }

          // Agent was made successfully
          if (tAgentRes.length) {
            await this.dataRepository.saveCreatedAgentsToDatabase(tAgentRes);
          } else {
            Bootstraper.getAudioPlayer().playNoNPCFoundBeep(); // todo: need to not beep or make a diff beep if it made a new agent
            fails++;
            continue;
          }
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

  async setFiltering(data: Array<Filter>): Promise<void> {
    OpenAIProtocolService.FiltersDirty = true;
    return this.dataRepository.setFiltering(data);
  }

  async getFiltering(): Promise<GetFilteringResponse> {
    return this.dataRepository.getFiltering();
  }

  applyFilterToMessage(msgContent: string) {
    let filteredMessage = msgContent;

    this.filters.forEach((filter) => {
      try {
        // Check if 'find' is a valid regex pattern or just a string
        let regex: RegExp;
        if (filter.find.startsWith("/") && filter.find.endsWith("/")) {
          // Treat it as a regex pattern if it starts and ends with slashes (optional check)
          regex = new RegExp(filter.find.slice(1, -1), "g"); // Remove slashes and apply 'g' flag
        } else {
          // Treat it as a plain string (escape special characters)
          regex = new RegExp(this.escapeRegExp(filter.find), "g");
        }

        filteredMessage = filteredMessage.replace(regex, filter.replace);
      } catch (error) {
        console.error("Error applying filter:", error, filter.find);
      }
    });

    return filteredMessage;
  }

  escapeRegExp(string: string) {
    return string.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, "\\$&"); // Escape special characters
  }
}
