import { Message } from "../../core/data/open_ai_protocol/LLMChatCompletionRequestBody";

export class Validator {
  public static removeEmptyContent(msg: Array<Message>): Array<Message> {
    return msg.filter((item) => item.content.length > 0);
  }
}
