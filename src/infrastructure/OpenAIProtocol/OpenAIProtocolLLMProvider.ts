import axios from "axios";
import { OpenAIProtocolTransport } from "./OpenAIProtocolTransport";
import { Response } from "express";
import * as config from "config";
import { IOpenAIProtocolLLMProvider } from "../../Core/Interfaces/IOpenAIProtocolLLMProvider";
import { Validator } from "../../Core/Validators/Validator";
import { LLMChatCompletionResponse } from "../../Core/Data/OpenAIProtocol/LLMChatCompletionResponse";

export class OpenAIProtocolLLMProvider implements IOpenAIProtocolLLMProvider {
  async handleMessage(res: Response, originalBody: string) {
    const headers = {
      //'Authorization': `Bearer YOUR_OPEN_AI_KEY`,
      "Content-Type": "application/json",
    };

    let orig = JSON.parse(originalBody);
    orig.stream = false;
    orig.messages = Validator.removeEmptyContent(orig.messages);

    console.log("Sending original incoming msg to fallback LLM");
    const response = await axios.post(config.LLM.ENDPOINT, orig, {
      headers: headers,
    });

    console.log("\n\nLLM Response", JSON.stringify(response.data));

    orig = JSON.parse(originalBody);

    if (orig.stream) {
      await OpenAIProtocolTransport.streamToClient(res, response.data);
      res.end();
    } else {
      res.json(response.data);
    }
  }

  async chatToLLM(
    prompt: string,
    maxTokens: number,
  ): Promise<LLMChatCompletionResponse> {
    const headers = {
      //'Authorization': `Bearer YOUR_OPEN_AI_KEY`,
      "Content-Type": "application/json",
    };
    const data = {
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    };

    try {
      const response = await axios.post(config.LLM.ENDPOINT, data, {
        headers: headers,
      });
      console.log("LLM Response: ", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching response from LLM:", error);
      throw error;
    }
  }
}
