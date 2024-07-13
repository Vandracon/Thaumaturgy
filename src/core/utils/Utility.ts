import { Message } from "../Data/OpenAIProtocol/LLMChatCompletionRequestBody";

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
      "Right",
      "Okay",
      "Uh-huh",
      "I understand",
      "Interesting",
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
}
