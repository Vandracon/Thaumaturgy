import { Message } from "../data/open_ai_protocol/LLMChatCompletionRequestBody";

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
      "Right, I've received your message, and I have no response.",
      "Okay, I've noted your message and have no response.",
      "Uh-huh, your message is acknowledged, I have no response.",
      "Sure, I've seen your message, I have no response at this time.",
      "I understand, your message has been noted, I have no response.",
      "Interesting, your message has been received, thank you. I have no response at this time.",
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
