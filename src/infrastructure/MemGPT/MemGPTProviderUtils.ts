import {
  FunctionCallMessage,
  MemGPTChatResponse,
} from "../../Core/Data/MemGPT/MemGPTChatResponse";
import { Message } from "../../Core/Data/OpenAIProtocol/LLMChatCompletionRequestBody";
import {
  Choice,
  LLMChatCompletionResponse,
} from "../../Core/Data/OpenAIProtocol/LLMChatCompletionResponse";
import { IDataRepository } from "../../Core/Interfaces/IDataRepository";
import { Utility } from "../../Core/Utils/Utility";

interface SystemAlertTrackerToAgent {
  sendsSinceLast: number;
  canSend: boolean;
}

interface ISystemAlertTrackerToAgent {
  [key: string]: SystemAlertTrackerToAgent;
}

export class MemGPTProviderUtils {
  private systemAlertTracker: ISystemAlertTrackerToAgent;

  constructor() {
    this.systemAlertTracker = {};
  }

  canSendSystemAlerts(agentId: string): boolean {
    this.ensureAlertTrackingEntityExists(agentId);
    return this.systemAlertTracker[agentId].canSend;
  }

  sendingSystemAlert(agentId: string) {
    this.ensureAlertTrackingEntityExists(agentId);
    this.systemAlertTracker[agentId].sendsSinceLast = 0;
    this.systemAlertTracker[agentId].canSend = false;
  }

  sendingUserMessage(agentId: string) {
    this.ensureAlertTrackingEntityExists(agentId);
    this.systemAlertTracker[agentId].sendsSinceLast++;
    if (this.systemAlertTracker[agentId].sendsSinceLast > 8) {
      this.systemAlertTracker[agentId].canSend = true;
    }
  }

  private ensureAlertTrackingEntityExists(agentId: string) {
    if (!this.systemAlertTracker[agentId]) {
      this.systemAlertTracker[agentId] = {
        sendsSinceLast: 0,
        canSend: true,
      };
    }
  }

  processResponseFromMemGPT(
    jsonObj: MemGPTChatResponse,
    dataRepository: IDataRepository,
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
            if (spoken.message && typeof spoken.message == "string") {
              body.choices.push(this.createAssistantEndChoice(spoken.message));
            }
          }
        }
      }
    } catch (e) {
      console.error("Error processing response from MemGPT", e);
      throw e;
    }

    // store response
    if (jsonObj.messages && jsonObj.messages.length) {
      dataRepository.storeMemGPTResponse(jsonObj.messages);
    }

    // AI decided not to respond with more dialog.
    // Inject random acknowledgement so user knows AI is done processing.
    if (body.choices.length == 0) {
      body.choices.push(
        this.createAssistantEndChoice(Utility.randomAcknowledgement()),
      );
    }

    // Combine all assistant messages into one if any occured, then replace the list.
    if (body.choices.length > 1) {
      let combinedContent = body.choices
        .reduce((accumulator, current: Choice) => {
          return accumulator + " " + (current.message as Message).content;
        }, "")
        .trim(); // Use trim to remove the leading space

      body.choices = [this.createAssistantEndChoice(combinedContent)];
    }

    return body;
  }

  private createAssistantEndChoice(msg: string) {
    return {
      index: 0,
      message: {
        role: "assistant",
        content: msg,
      },
      finish_reason: "stop",
    };
  }
}
