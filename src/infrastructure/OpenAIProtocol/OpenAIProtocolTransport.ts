import { Response } from "express";
import { LLMChatCompletionResponse } from "../../Core/Data/OpenAIProtocol/LLMChatCompletionResponse";
import { Message } from "../../Core/Data/OpenAIProtocol/LLMChatCompletionRequestBody";
import { Utility } from "../../Core/Utils/Utility";

export class OpenAIProtocolTransport {
  static async streamToClient(res: Response, reply: LLMChatCompletionResponse) {
    let fullMessage = (reply.choices[0].message as Message).content;

    let tokens = fullMessage.split(" ");

    let finalReply = [];

    let payloadId = Utility.generateChatChunkId();
    let created = Math.floor(Date.now() / 1000);

    for (let i = 0; i < tokens.length; i++) {
      if (i != tokens.length - 1) tokens[i] += " ";

      let finishReason = null;
      let delta = {
        role: "assistant",
        content: tokens[i],
      };

      finalReply.push(
        Utility.buildMessageChunk(payloadId, created, "", delta, finishReason),
      );
    }

    finalReply.push(
      Utility.buildMessageChunk(payloadId, created, "", {}, "stop"),
    );

    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    console.log("Streaming response");
    for (let item of finalReply) {
      //console.dir(item);
      //console.dir(item.choices[0].delta);
      res.write(`data: ${JSON.stringify(item)}\n\n`);
      await delay(1);
    }
    console.log("Streaming done");
  }
}
