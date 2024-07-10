import axios from "axios";
import { IMemGPTProvider } from "../core/interfaces/IMemGPTProvider";
import { Utility } from "../core/utils/Utility";
import {
  FunctionCallMessage,
  MemGPTChatResponse,
} from "../core/data/memgpt/MemGPTChatResponse";
import { LLMChatCompletionResponse } from "../core/data/open_ai_protocol/LLMChatCompletionResponse";
import { Response } from "express";
import { OpenAIProtocolTransport } from "./OpenAIProtocolTransport";
import { LLMChatRequestMessageBody } from "../core/data/open_ai_protocol/LLMChatRequestMessageBody";

const config = require("config");

export class MemGPTProvider implements IMemGPTProvider {
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
          config.MEMGPT_ENDPOINT + `/agents/${agentId}/messages`,
          systemMessageBody,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.MEMGPT_TOKEN}`,
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
        config.MEMGPT_ENDPOINT + `/agents/${agentId}/messages`,
        userMessageBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.MEMGPT_TOKEN}`,
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
}
