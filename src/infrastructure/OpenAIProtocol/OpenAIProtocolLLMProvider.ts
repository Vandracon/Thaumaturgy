import axios from "axios";
import { Response } from "express";
import * as config from "config";
import { IOpenAIProtocolLLMProvider } from "../../Core/Interfaces/IOpenAIProtocolLLMProvider";
import { Validator } from "../../Core/Validators/Validator";
import { LLMChatCompletionResponse } from "../../Core/Data/OpenAIProtocol/LLMChatCompletionResponse";
import { Message } from "../../Core/Data/OpenAIProtocol/LLMChatCompletionRequestBody";

export class OpenAIProtocolLLMProvider implements IOpenAIProtocolLLMProvider {
  async handleMessage(res: Response, originalBody: string): Promise<void> {
    const headers = {
      //'Authorization': `Bearer YOUR_OPEN_AI_KEY`,
      "Content-Type": "application/json",
    };

    let orig = JSON.parse(originalBody);
    orig.messages = Validator.removeEmptyContent(orig.messages);

    if (orig.stream) {
      console.log("Streaming LLM response to client");
      const streamResponse = await axios({
        method: "post",
        url: config.LLM.ENDPOINT,
        headers: headers,
        data: orig,
        responseType: "stream",
      });

      await new Promise<void>((resolve, reject) => {
        streamResponse.data.pipe(res);
        streamResponse.data.on("end", () => {
          res.end();
          resolve();
        });
        streamResponse.data.on("error", (error: Error) => {
          console.error("Error streaming data:", error);
          res.status(500).end();
          reject(error);
        });
      });
    } else {
      const response = await axios.post(config.LLM.ENDPOINT, orig, {
        headers: headers,
      });
      console.log("\n\nNon-Stream LLM Response", JSON.stringify(response.data));
      res.json(response.data);
    }
  }

  async simpleUserRequestToLLM(
    systemPrompt: string | null,
    userPrompt: string | null,
    maxTokens: number,
    model: string,
    frequency_penalty: number,
    stop: any,
    temperature: number,
    top_p: number,
  ): Promise<LLMChatCompletionResponse> {
    const headers = {
      //'Authorization': `Bearer YOUR_OPEN_AI_KEY`,
      "Content-Type": "application/json",
    };
    let messages = [];
    if (systemPrompt != null)
      messages.push({ role: "system", content: systemPrompt });
    if (userPrompt != null)
      messages.push({ role: "user", content: userPrompt });

    const data: any = {
      messages: messages,
      max_tokens: maxTokens,
      stream: false,
      model: model || config.LLM.MODEL_NAME,
    };

    if (frequency_penalty) data.frequency_penalty = frequency_penalty;
    if (stop) data.stop = stop;
    if (temperature) data.temperature = temperature;
    if (top_p) data.top_p = top_p;

    try {
      const response = await axios.post(config.LLM.ENDPOINT, data, {
        headers: headers,
      });
      console.log("LLM Response: ", response.data);
      //console.log("LLM Detailed Response: ", response.data.choices[0]);
      return response.data;
    } catch (error) {
      console.error("Error fetching response from LLM:", error);
      throw error;
    }
  }

  async sendToLLM(
    messages: Array<Message>,
    maxTokens: number,
    model: string,
    frequency_penalty: number,
    stop: any,
    temperature: number,
    top_p: number,
  ): Promise<LLMChatCompletionResponse> {
    const headers = {
      //'Authorization': `Bearer YOUR_OPEN_AI_KEY`,
      "Content-Type": "application/json",
    };
    const data: any = {
      messages: messages,
      max_tokens: maxTokens,
      stream: false,
      model: model || config.LLM.MODEL_NAME,
    };

    if (frequency_penalty) data.frequency_penalty = frequency_penalty;
    if (stop) data.stop = stop;
    if (temperature) data.temperature = temperature;
    if (top_p) data.top_p = top_p;

    try {
      const response = await axios.post(config.LLM.ENDPOINT, data, {
        headers: headers,
      });
      console.log(
        "LLM Response (sendToLLM): ",
        response.data,
        response.data.choices,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching response from LLM (sendToLLM):", error);
      throw error;
    }
  }
}
