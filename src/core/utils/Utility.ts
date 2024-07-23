import { Message } from "../Data/OpenAIProtocol/LLMChatCompletionRequestBody";
import * as config from "config";

export class Utility {
  public static generateChatChunkId() {
    const prefix = "chatcmpl-";
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 20; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return prefix + result;
  }

  public static randomAcknowledgement() {
    const acknowledgements = [
      // "Right, I have no more to say at the moment.",
      // "Okay, that's all I can say at the moment.",
      // "Uh-huh, I understand what you're saying.",
      // "I understand, I have nothing yet to say.",
      // "Interesting, but I have no reply yet.",
      "I have no response at the moment.",
    ];

    const randomIndex = Math.floor(Math.random() * acknowledgements.length);
    return acknowledgements[randomIndex];
  }

  public static buildMessageChunk(
    id: string,
    createdInSeconds: number,
    model: string,
    delta: Message | Object,
    finishReason: string | null,
  ) {
    return {
      id: id,
      object: "chat.completion.chunk",
      created: createdInSeconds,
      model: model,
      choices: [
        {
          index: 0,
          delta: delta,
          finish_reason: finishReason,
        },
      ],
    };
  }

  public static getMockMemGPTResponse() {
    return {
      messages: [],
      usage: {
        completion_tokens: 0,
        prompt_tokens: 0,
        total_tokens: 0,
        step_count: 0,
      },
    };
  }

  public static calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;

    values.sort((a, b) => a - b);

    const half = Math.floor(values.length / 2);

    if (values.length % 2) return values[half];

    return (values[half - 1] + values[half]) / 2.0;
  }

  public static calculateMAD(values: number[], median: number): number {
    const deviations = values.map((value) => Math.abs(value - median));
    return this.calculateMedian(deviations);
  }
}
