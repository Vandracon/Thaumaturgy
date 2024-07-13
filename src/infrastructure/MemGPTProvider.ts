import axios from "axios";
import { Response } from "express";
import * as config from "config";
import fs from "fs";
import { IMemGPTProvider } from "../Core/Interfaces/IMemGPTProvider";
import { LLMChatRequestMessageBody } from "../Core/Data/OpenAIProtocol/LLMChatRequestMessageBody";
import { ProcessedBio } from "../Core/Data/Importer/ProcessedBio";
import {
  MemGPTChatResponse,
  FunctionCallMessage,
} from "../Core/Data/MemGPT/MemGPTChatResponse";
import { LLMChatCompletionResponse } from "../Core/Data/OpenAIProtocol/LLMChatCompletionResponse";
import { Preset } from "../Core/Entities/Preset";
import { Utility } from "../Core/Utils/Utility";
import { OpenAIProtocolTransport } from "./OpenAIProtocol/OpenAIProtocolTransport";
import { Agent } from "../Core/Entities/Agent";
import { IDataRepository } from "../Core/Interfaces/IDataRepository";

export class MemGPTProvider implements IMemGPTProvider {
  constructor(private dataRepository: IDataRepository) {}

  async handleMessage(
    res: Response,
    hasSystemPrompt: boolean,
    agentId: string,
    systemMessageBody: LLMChatRequestMessageBody,
    userMessageBody: LLMChatRequestMessageBody,
  ) {
    console.log("Using MemGPT");

    if (hasSystemPrompt) {
      console.log("Sending system alert to MemGPT");
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
    let response;
    try {
      response = await axios.post(
        `${config.MEMGPT.BASE_URL}${config.MEMGPT.ENDPOINTS.AGENTS}/${agentId}/messages`,
        userMessageBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.MEMGPT.AUTH_TOKEN}`,
          },
          timeout: 45000,
        },
      );
    } catch (e) {
      console.error("Unable to send user message to MemGPT");
      response = {
        data: Utility.getMockMemGPTResponse(),
      };
    }

    let reply = this.processResponseFromMemGPT(response.data);
    console.log("processed reply", reply.choices[0]);

    // Stream response to client
    await OpenAIProtocolTransport.streamToClient(res, reply);
    res.end();
  }

  processResponseFromMemGPT(
    jsonObj: MemGPTChatResponse,
  ): LLMChatCompletionResponse {
    console.log("Response from MemGPT", JSON.stringify(jsonObj));

    let body: LLMChatCompletionResponse = {
      id: "",
      object: "chat_completion",
      created: Math.floor(Date.now() / 1000),
      model: "Unknown (MemGPT)",
      choices: [],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    };

    try {
      for (let msg of jsonObj.messages) {
        if ((msg as FunctionCallMessage).function_call !== undefined) {
          let functionCallMessage = msg as FunctionCallMessage;

          if (functionCallMessage.function_call.name == "send_message") {
            let spoken = JSON.parse(
              functionCallMessage.function_call.arguments,
            );
            body.choices.push({
              index: 0,
              message: {
                role: "assistant",
                content: spoken.message,
              },
              finish_reason: "stop",
            });
          }
        }
      }
    } catch (e) {
      console.error("Error processing response from MemGPT", e);
      throw e;
    }

    // store response
    if (jsonObj.messages && jsonObj.messages.length) {
      this.dataRepository.storeMemGPTResponse(jsonObj.messages);
    }

    // AI decided not to respond with more dialog.
    // Inject random acknowledgement so user knows AI is done processing.
    if (body.choices.length == 0) {
      body.choices.push({
        index: 0,
        message: {
          role: "assistant",
          content: Utility.randomAcknowledgement(),
        },
        finish_reason: "stop",
      });
    }

    return body;
  }

  async createPersonas(bios: Array<ProcessedBio>): Promise<Array<any>> {
    let i = 0;
    let responses: Array<any> = [];

    for (let bio of bios) {
      console.log(`Creating persona ${i + 1} of ${bios.length}`);
      i++;

      try {
        const response = await axios.post(
          config.MEMGPT.BASE_URL + config.MEMGPT.ENDPOINTS.PERSONAS,
          bio,
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
      let filePath = `${process.cwd()}/data/${config.IMPORTER.FILE_USER_CREATE_RESPONSE}`;
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

  async createAgents(agents: Array<Agent>): Promise<Array<any>> {
    let i = 0;

    let responses: Array<any> = [];

    for (let agent of agents) {
      console.log(`Creating agent ${i + 1} of ${agents.length}`);
      i++;

      var body: any = {
        config: agent.package(),
      };

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
}
