import axios from "axios";
import { Response } from "express";
import * as config from "config";
import fs from "fs";
import { IMemGPTProvider } from "../../Core/Interfaces/IMemGPTProvider";
import { LLMChatRequestMessageBody } from "../../Core/Data/OpenAIProtocol/LLMChatRequestMessageBody";
import { ProcessedBio } from "../../Core/Data/Importer/ProcessedBio";
import { Preset } from "../../Core/Entities/Preset";
import { Utility } from "../../Core/Utils/Utility";
import { OpenAIProtocolTransport } from "./../OpenAIProtocol/OpenAIProtocolTransport";
import { Agent, ThaumaturgyAgent } from "../../Core/Entities/Agent";
import { IDataRepository } from "../../Core/Interfaces/IDataRepository";
import { CoreMemoryResponse } from "../../Core/Data/MemGPT/CoreMemory";
import { Bootstraper } from "../../Server/Bootstrapper";
import { MemGPTProviderUtils } from "./MemGPTProviderUtils";
import { MemGPTGroupChatHandler } from "./MemGPTGroupChatHandler";

export class MemGPTProvider implements IMemGPTProvider {
  private responseTimes: number[];
  private dynamicTimeout: number;
  private firstMessageTracker: { [key: string]: boolean };

  constructor(
    private dataRepository: IDataRepository,
    private memGPTGroupChatHandler: MemGPTGroupChatHandler,
    private memGPTProviderUtils: MemGPTProviderUtils,
  ) {
    this.responseTimes = [];
    this.dynamicTimeout =
      config.MEMGPT.ADDITIONAL_DYNAMIC_RESPONSE_TIMEOUT_IN_MS;

    // A guard for a sane first value if config value is tiny
    if (this.dynamicTimeout < 5000) this.dynamicTimeout = 5000;
    this.firstMessageTracker = {};
  }

  handleGroupMessage(
    res: Response,
    hasSystemPrompt: boolean,
    agents: Array<ThaumaturgyAgent>,
    systemMessageBody: LLMChatRequestMessageBody,
    userMessageBody: LLMChatRequestMessageBody,
    originalBody: string,
    playerUserIncluded: boolean,
    maxTokens: number,
  ): Promise<void> {
    return this.memGPTGroupChatHandler.handle(
      this,
      res,
      hasSystemPrompt,
      agents,
      systemMessageBody,
      userMessageBody,
      originalBody,
      playerUserIncluded,
      maxTokens,
    );
  }

  isInGroupConversation(): boolean {
    return this.memGPTGroupChatHandler.isInGroupConversation();
  }

  endGroupConversation(
    //hasSystemPrompt: boolean,
    //systemMessageBody: LLMChatRequestMessageBody,
    //userMessageBody: LLMChatRequestMessageBody,
    originalBody: string,
    //playerUserIncluded: boolean,
    //maxTokens: number,
  ): Promise<void> {
    return this.memGPTGroupChatHandler.endGroupConversation(
      //this,
      //hasSystemPrompt,
      //systemMessageBody,
      //userMessageBody,
      originalBody,
      //playerUserIncluded,
      //maxTokens,
    );
  }

  async handleOneOnOneMessage(
    res: Response,
    hasSystemPrompt: boolean,
    agentId: string,
    systemMessageBody: LLMChatRequestMessageBody,
    userMessageBody: LLMChatRequestMessageBody,
  ) {
    console.log("Using MemGPT");

    let canSendSystemAlert =
      this.memGPTProviderUtils.canSendSystemAlerts(agentId);

    // todo: need to get systemPrompts to show up again from processing unique format for group convos.

    // Just metrics
    if (hasSystemPrompt && !canSendSystemAlert) {
      console.log(
        `Can't send system alert to agentId: ${agentId} so soon after the previous one.`,
      );
    }
    // End

    if (hasSystemPrompt && canSendSystemAlert) {
      console.log("Sending system alert to MemGPT");
      this.memGPTProviderUtils.sendingSystemAlert(agentId);
      try {
        await axios.post(
          `${config.MEMGPT.BASE_URL}${config.MEMGPT.ENDPOINTS.AGENTS}/${agentId}/messages`,
          systemMessageBody,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.MEMGPT.AUTH_TOKEN}`,
            },
            timeout: 16000,
          },
        );
      } catch (e: any) {
        console.warn("Unable to send system alert", e.message);
      }
    }

    // Do a user post
    console.log(
      `Posting user message to MemGPT agentId: ${agentId}`,
      userMessageBody,
    );
    this.memGPTProviderUtils.sendingUserMessage(agentId);

    let response;
    try {
      const startTime = Date.now();

      // First messages to agents could take a little longer to initialize so we add padding to dynamicTimeout.
      if (!this.firstMessageTracker[agentId]) {
        this.dynamicTimeout +=
          config.MEMGPT.ADDITIONAL_DYNAMIC_RESPONSE_TIMEOUT_FOR_FIRST_MESSAGE_IN_MS;
        this.firstMessageTracker[agentId] = true;
      }

      response = await axios.post(
        `${config.MEMGPT.BASE_URL}${config.MEMGPT.ENDPOINTS.AGENTS}/${agentId}/messages`,
        userMessageBody,
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
      const mad = Utility.calculateMAD(this.responseTimes, medianResponseTime);

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
    } catch (e: any) {
      console.error(
        `Unable to send user message to MemGPT${e ? ": " + e.message : ""}`,
      );
      response = {
        data: Utility.getMockMemGPTResponse(),
      };

      Bootstraper.getAudioPlayer().playErrorBeep();
    }

    let reply = this.memGPTProviderUtils.processResponseFromMemGPT(
      response.data,
      this.dataRepository,
    );
    console.log("processed reply", reply.choices[0]);

    // Stream response to client
    await OpenAIProtocolTransport.streamToClient(res, reply);
    res.end();
  }

  async createPersonas(bios: Array<ProcessedBio>): Promise<Array<any>> {
    let i = 0;
    let responses: Array<any> = [];

    for (let bio of bios) {
      console.log(`Creating persona ${i + 1} of ${bios.length}`);
      i++;

      let body = {
        name: bio.name,
        text: bio.persona_header + bio.persona,
      };

      try {
        const response = await axios.post(
          config.MEMGPT.BASE_URL + config.MEMGPT.ENDPOINTS.PERSONAS,
          body,
          {
            headers: {
              authorization: `Bearer ${config.MEMGPT.AUTH_TOKEN}`,
              accept: "application/json",
              "content-type": "application/json",
            },
          },
        );

        responses.push(response.data);
      } catch (e) {
        console.error(
          "Error creating persona. You likely need to clear MemGPT database when you try again",
          e,
        );
        throw e;
      }
    }

    return responses;
  }

  async createUserTemplate(
    userTemplateName: string,
    userTemplate: string,
    domain: string,
  ): Promise<void> {
    console.log("Creating user template");
    var body = {
      name: userTemplateName,
      text: userTemplate,
    };

    const response = await axios.post(
      config.MEMGPT.BASE_URL + config.MEMGPT.ENDPOINTS.HUMANS,
      body,
      {
        headers: {
          authorization: `Bearer ${config.MEMGPT.AUTH_TOKEN}`,
          accept: "application/json",
          "content-type": "application/json",
        },
      },
    );

    try {
      let filePath = `${process.cwd()}/data/domain/${domain}/${config.IMPORTER.FILE_USER_CREATE_RESPONSE}`;
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(response.data),
        "utf-8",
      );
      console.log(`Data has been written to file at ${filePath}`);
    } catch (error) {
      console.error(`Error writing data to file: ${error}`);
      throw error;
    }
  }

  async createPreset(preset: Preset): Promise<void> {
    const response = await axios.post(
      config.MEMGPT.BASE_URL + config.MEMGPT.ENDPOINTS.PRESETS,
      preset.serialize(),
      {
        headers: {
          authorization: `Bearer ${config.MEMGPT.AUTH_TOKEN}`,
          accept: "application/json",
          "content-type": "application/json",
        },
      },
    );

    try {
      let filePath = `${process.cwd()}/data/${config.IMPORTER.FILE_CREATE_PRESET_RESPONSE}`;
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(response.data),
        "utf-8",
      );
      console.log(`Data has been written to file at ${filePath}`);
    } catch (error) {
      console.error(`Error writing data to file: ${error}`);
      throw error;
    }
  }

  async createAgents(
    agents: Array<Agent>,
    systemPrompt: string,
  ): Promise<Array<any>> {
    let i = 0;

    let responses: Array<any> = [];

    for (let agent of agents) {
      let log = `Creating agent ${i + 1} of ${agents.length}`;
      console.log(log);
      Utility.LastImportStatusUpdate = log;
      i++;

      var body: any = {
        config: agent.package(),
      };

      body.config.system = systemPrompt;

      try {
        const response = await axios.post(
          config.MEMGPT.BASE_URL + config.MEMGPT.ENDPOINTS.AGENTS,
          body,
          {
            headers: {
              authorization: `Bearer ${config.MEMGPT.AUTH_TOKEN}`,
              accept: "application/json",
              "content-type": "application/json",
            },
          },
        );

        responses.push(response.data);
      } catch (e) {
        console.error("Error making agent", e);
        throw e;
      }
    }
    return responses;
  }

  async getCoreMemory(agentId: string): Promise<CoreMemoryResponse> {
    try {
      const response = await axios.get(
        `${config.MEMGPT.BASE_URL}${config.MEMGPT.ENDPOINTS.AGENTS}/${agentId}/memory`,
        {
          headers: {
            authorization: `Bearer ${config.MEMGPT.AUTH_TOKEN}`,
            accept: "application/json",
            "content-type": "application/json",
          },
        },
      );

      return response.data;
    } catch (e) {
      console.error("Error getting agent core memory", e);
      throw e;
    }
  }

  async updateCoreMemory(
    agentId: string,
    human: string,
    persona: string,
  ): Promise<void> {
    try {
      const response = await axios.post(
        `${config.MEMGPT.BASE_URL}${config.MEMGPT.ENDPOINTS.AGENTS}/${agentId}/memory`,
        {
          human: human,
          persona: persona,
        },
        {
          headers: {
            authorization: `Bearer ${config.MEMGPT.AUTH_TOKEN}`,
            accept: "application/json",
            "content-type": "application/json",
          },
        },
      );

      return response.data;
    } catch (e) {
      console.error("Error updating agent core memory");
    }
  }

  async addToArchivalMemory(agentId: string, content: string): Promise<void> {
    try {
      const response = await axios.post(
        `${config.MEMGPT.BASE_URL}${config.MEMGPT.ENDPOINTS.AGENTS}/${agentId}/archival`,
        {
          content: content,
        },
        {
          headers: {
            authorization: `Bearer ${config.MEMGPT.AUTH_TOKEN}`,
            accept: "application/json",
            "content-type": "application/json",
          },
        },
      );

      return response.data;
    } catch (e) {
      console.error("Error adding to agent archival memory");
    }
  }

  async sendNonStreamingMessage(
    agentId: string,
    message: string,
  ): Promise<any> {
    let response = await axios.post(
      `${config.MEMGPT.BASE_URL}${config.MEMGPT.ENDPOINTS.AGENTS}/${agentId}/messages`,
      {
        message,
        role: "user",
        stream_steps: false,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.MEMGPT.AUTH_TOKEN}`,
        },
      },
    );

    return response.data;
  }
}
