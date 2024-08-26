import axios from "axios";
import { LLMChatRequestMessageBody } from "../../Core/Data/OpenAIProtocol/LLMChatRequestMessageBody";
import {
  ThaumaturgyAgent,
  ThaumaturgyAgentWithMemGPTCoreMemory,
} from "../../Core/Entities/Agent";
import * as config from "config";
import { Utility } from "../../Core/Utils/Utility";
import { Response } from "express";
import { IMemGPTProvider } from "../../Core/Interfaces/IMemGPTProvider";
import { IOpenAIProtocolLLMProvider } from "../../Core/Interfaces/IOpenAIProtocolLLMProvider";
import { IDataRepository } from "../../Core/Interfaces/IDataRepository";
import { Message } from "../../Core/Data/OpenAIProtocol/LLMChatCompletionRequestBody";
import { OpenAIProtocolTransport } from "../OpenAIProtocol/OpenAIProtocolTransport";
import { LLMChatCompletionResponse } from "../../Core/Data/OpenAIProtocol/LLMChatCompletionResponse";
import { Bootstraper } from "../../Server/Bootstrapper";

export class MemGPTGroupChatHandler {
  private responseTimes: number[];
  private dynamicTimeout: number;
  private firstMessageTracker: { [key: string]: boolean };
  private inGroupChat: boolean;
  private agentsWithMemory: Array<ThaumaturgyAgentWithMemGPTCoreMemory>;

  constructor(
    private llmProvider: IOpenAIProtocolLLMProvider,
    private dataRepository: IDataRepository,
  ) {
    this.responseTimes = [];
    this.dynamicTimeout =
      config.MEMGPT.ADDITIONAL_DYNAMIC_RESPONSE_TIMEOUT_IN_MS;

    // A guard for a sane first value if config value is tiny
    if (this.dynamicTimeout < 5000) this.dynamicTimeout = 5000;
    this.firstMessageTracker = {};
    this.inGroupChat = false;
    this.agentsWithMemory = [];
  }

  async handle(
    memGPTProvider: IMemGPTProvider,
    res: Response,
    hasSystemPrompt: boolean,
    agents: Array<ThaumaturgyAgent>,
    systemMessageBody: LLMChatRequestMessageBody,
    lastUserMessageBody: LLMChatRequestMessageBody,
    originalBody: string,
    playerUserIncluded: boolean,
    maxTokens: number,
  ) {
    try {
      // - Query MemGPT for each detected agent and fetch their persona.
      for (let agent of agents) {
        let thaumGPTAgent = this.agentsWithMemory.filter(
          (a) => a.id == agent.id,
        );

        // Only fetch if its not cached
        if (!thaumGPTAgent.length) {
          console.log(
            `Caching core memories of user ${agent.name} for this convo`,
          );
          let coreMemory = (await memGPTProvider.getCoreMemory(agent.id))
            .core_memory;
          this.agentsWithMemory.push(
            new ThaumaturgyAgentWithMemGPTCoreMemory(
              agent.id,
              agent.name,
              agent.initial_persona_header,
              agent.initial_persona,
              coreMemory,
            ),
          );
        }
      }

      let originalRequest = JSON.parse(originalBody);

      // - If entering group chat, send system message to each agent about the conversation starting (for later context)
      // In case the agent does not reply directly. We don't wait for them to respond here.
      if (!this.inGroupChat) {
        let memGPTSystemPrompt = JSON.parse(JSON.stringify(systemMessageBody));
        memGPTSystemPrompt.message =
          config.MEMGPT.GROUP_CHAT.DEFAULT_SYSTEM_PROMPT;
        this.sendMessageToNPCs(agents, memGPTSystemPrompt);
        this.inGroupChat = true;
      }

      let systemPromptToLLM = "";
      if (hasSystemPrompt) {
        systemPromptToLLM =
          systemMessageBody.message +
          " " +
          this.buildAgentGroupConversationSystemPrompt(
            this.agentsWithMemory,
            playerUserIncluded,
          );
      }

      // Format messages to LLM
      let messages: Array<Message> = [];
      messages.push({ role: "system", content: systemPromptToLLM });
      for (let msg of originalRequest.messages as Array<Message>) {
        if (msg.role == "system")
          continue; // We already modified system prompt and wont use original one.
        else messages.push(msg);
      }

      console.log(
        `LLM Message Send \n\n${JSON.stringify(messages)} \n\nMAXTOKENS: ${maxTokens}`,
      );

      // Utilize actual LLM for the group convo.
      let llmResponse = await this.llmProvider.sendToLLM(messages, maxTokens);

      if (originalRequest.stream) {
        await OpenAIProtocolTransport.streamToClient(res, llmResponse);
        res.end();
      } else {
        res.json(llmResponse);
      }
    } catch (error) {
      console.error("Error handling group chat:", error);
      res.status(500).send("Internal server error");
    }
  }

  public isInGroupConversation(): boolean {
    return this.inGroupChat;
  }

  public async endGroupConversation(
    //memGPTProvider: IMemGPTProvider,
    //hasSystemPrompt: boolean,
    //systemMessageBody: LLMChatRequestMessageBody,
    //userMessageBody: LLMChatRequestMessageBody,
    originalBody: string,
    //playerUserIncluded: boolean,
    //maxTokens: number,
  ): Promise<void> {
    this.inGroupChat = false;

    // Request for a summary from LLM.
    let body = JSON.parse(originalBody);
    body.stream = false;

    for (let agent of this.agentsWithMemory) {
      // For each agent, make a summary.

      for (let msg of body.messages as Array<Message>) {
        if (msg.role == "system")
          msg.content = `You are tasked with summarizing the conversation. Do so from YOUR perspective as the character 
        named ${agent.name}. It is not necessary to comment on any mixups in communication such as mishearings. Text contained within asterisks 
        state in-game events. Please summarize the conversation into a single paragraph`;
      }
      const response = await axios.post(config.LLM.ENDPOINT, body, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.MEMGPT.AUTH_TOKEN}`,
        },
      });

      let data = response.data as LLMChatCompletionResponse;
      console.log(
        `\n\n${agent.name} Summary: ${JSON.stringify(response.data)}`,
      );

      let summary = "";
      if (data.choices && data.choices.length) {
        summary = (data.choices[0].message as Message).content;
      }

      if (summary.length == 0) summary = "[Error summarizing conversation]";

      let messageToAgent: LLMChatRequestMessageBody = {
        message:
          `Group Conversation: Note! Save any information if necessary and reply to me with your own summary. ` +
          `This summary is done to include this data into your conversational history. You will be notified again ` +
          `if the conversation is going to resume, otherwise it has finished. Here is a summary for this group conversation: ${summary}`,
        role: "user",
        stream: false,
      };

      console.log(
        `Ending convo with agent: ${agent.name} agentId: ${agent.id}. Sending group convo summary to them.`,
      );

      // Let agent know about the convo summary saving.
      let agentResponse = await axios.post(
        `${config.MEMGPT.BASE_URL}${config.MEMGPT.ENDPOINTS.AGENTS}/${agent.id}/messages`,
        messageToAgent,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.MEMGPT.AUTH_TOKEN}`,
          },
          timeout: this.dynamicTimeout + 10000,
        },
      );

      console.log(
        `\nAgent ${agent.name} Ending Convo Reply: ${JSON.stringify(agentResponse.data)}`,
      );

      // store agent response
      if (agentResponse.data.messages && agentResponse.data.messages.length) {
        this.dataRepository.storeMemGPTResponse(agentResponse.data.messages);
      }
    }

    // Clear data
    this.agentsWithMemory = [];
    this.inGroupChat = false;
  }

  // Placeholder method to send a message to an NPC
  private async sendMessageToNPCs(
    agents: Array<ThaumaturgyAgent>,
    messageBody: LLMChatRequestMessageBody,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Send message to each agent and get the response
      for (let i = 0; i < agents.length; i++) {
        // First messages to agents could take a little longer to initialize so we add padding to dynamicTimeout.
        if (!this.firstMessageTracker[agents[0].id]) {
          this.dynamicTimeout +=
            config.MEMGPT.ADDITIONAL_DYNAMIC_RESPONSE_TIMEOUT_FOR_FIRST_MESSAGE_IN_MS;
          this.firstMessageTracker[agents[0].id] = true;
        }

        await axios.post(
          `${config.MEMGPT.BASE_URL}${config.MEMGPT.ENDPOINTS.AGENTS}/${agents[0].id}/messages`,
          messageBody,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.MEMGPT.AUTH_TOKEN}`,
            },
            timeout: this.dynamicTimeout,
          },
        );

        // Dynamic Response Time
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        this.responseTimes.push(responseTime);

        if (this.responseTimes.length > 100) {
          // limit the size to the last 100 observations
          this.responseTimes.shift();
        }

        const medianResponseTime = Utility.calculateMedian(this.responseTimes);
        const mad = Utility.calculateMAD(
          this.responseTimes,
          medianResponseTime,
        );

        // Calculate MAD with scale PLUS recent max
        this.dynamicTimeout = Utility.calculateMADWithScaleAndMax(
          medianResponseTime,
          mad,
        );
        // End Dynamic Response Time

        if (responseTime)
          console.log(
            `MemGPT Average Response Time: ${this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length}ms`,
          );
        console.log(`New dynamic timeout ${this.dynamicTimeout}ms*`);

        // let reply = this.memGPTProviderUtils.processResponseFromMemGPT(
        //   response.data,
        //   this.dataRepository,
        // );
        // console.log("processed reply", reply.choices[0]);
      }
    } catch (e: any) {
      console.error(
        `Unable to send user message to MemGPT${e ? ": " + e.message : ""}`,
      );
      Bootstraper.getAudioPlayer().playErrorBeep();
    }
  }

  private buildAgentGroupConversationSystemPrompt(
    agents: Array<ThaumaturgyAgentWithMemGPTCoreMemory>,
    playerUserIncluded: boolean,
  ) {
    let nameList = "";
    let bios = "";
    for (const [index, agent] of agents.entries()) {
      if (index == agents.length - 1) {
        if (playerUserIncluded) nameList += agent.name + ", and The User";
        else nameList += " and " + agent.name;
      } else nameList += agent.name + ", ";

      bios += `\n\n###\n\n${agent.name}: ${agent.coreMemory.persona}\n\n`;
      bios += `Knowledge of User:\n${agent.coreMemory.human}`;
    }

    return `The participants are (${nameList}). Each of their bios are as follows..${bios}`;
  }
}
