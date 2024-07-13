import { Message } from "../Data/OpenAIProtocol/LLMChatCompletionRequestBody";

export class Validator {
  public static removeEmptyContent(msg: Array<Message>): Array<Message> {
    return msg.filter((item) => item.content.length > 0);
  }
}
