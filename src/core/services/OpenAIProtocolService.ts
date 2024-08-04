import { Request, Response } from "express";
import { IOpenAIProtocolService } from "../Interfaces/IOpenAIProtocolService";
import { IOpenAIProtocolLLMProvider } from "../Interfaces/IOpenAIProtocolLLMProvider";
import { IMemGPTProvider } from "../Interfaces/IMemGPTProvider";
import { IDataRepository } from "../Interfaces/IDataRepository";
import { ThaumaturgyAgent } from "../Entities/Agent";
import { LLMChatRequestMessageBody } from "../Data/OpenAIProtocol/LLMChatRequestMessageBody";
import { Validator } from "../Validators/Validator";
import { performance } from "perf_hooks";
import { Bootstraper } from "../../Server/Bootstrapper";

export class OpenAIProtocolService implements IOpenAIProtocolService {
  constructor(
    private openAIProtocolLLMProvider: IOpenAIProtocolLLMProvider,
    private memGPTProvider: IMemGPTProvider,
    private dataRepository: IDataRepository,
  ) {}

  async handleMessage(req: Request, res: Response): Promise<void> {
    if (req.body.messages.length > 0) {
      req.body.messages = Validator.removeEmptyContent(req.body.messages);
    }

    let originalBody = JSON.stringify(req.body);
    console.log("Incoming /v1/chat/completions", req.body);

    let agentId: string | null = "";
    let hasSystemPromptForMemGPT = false;
    let systemMessageBody: LLMChatRequestMessageBody = {
      message: "",
      role: "system",
      stream: false,
    };
    let userMessageBody: LLMChatRequestMessageBody = {
      message: "",
      role: "user",
      stream: false,
    };

    /* 
        Todo: Update when MemGPT supports runtime prompt editing.
        Adds a small bit of info from game to the user message under *msg* format for now.
        The rest of the former prompt is already added to the system.
      */
    let user_message_prompt: string | null = "";

    for (let msg of req.body.messages) {
      if (msg.role == "system") {
        let sys = await this.processSystemMessage(msg.content);
        agentId = sys.agent_id;
        msg.content = sys.updated_system_prompt;
        //user_message_prompt = sys.user_message_prompt;
        if (msg.content && msg.content.length > 0) {
          hasSystemPromptForMemGPT = true;
          systemMessageBody.message = msg.content;
        } else {
          msg.content = sys.fallback_prompt;
          systemMessageBody.message = sys.fallback_prompt;
        }
      } else if (msg.role == "user") {
        let usrMsg = await this.processUserMessage(msg.content);
        //if (user_message_prompt ? user_message_prompt.length > 0 : false)
        //user_message_prompt += " ";
        msg.content = user_message_prompt + usrMsg;
        userMessageBody.message = msg.content;
      }
    }

    // Set the appropriate headers
    if (req.body.stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Transfer-Encoding", "chunked");
    } else {
      res.setHeader("Content-Type", "application/json");
    }

    let startTime = performance.now();

    if (agentId && agentId.length > 0) {
      // console.log("SYSTEM", systemMessageBody);
      // console.log("USER", userMessageBody);
      await this.memGPTProvider.handleMessage(
        res,
        hasSystemPromptForMemGPT,
        agentId,
        systemMessageBody,
        userMessageBody,
      );
    } else {
      Bootstraper.getAudioPlayer().playSound(
        `${process.cwd()}/data/sounds/beep-llm.wav`,
        0.05,
      );

      // If no agentId was found. Fallback to using the LLM directly
      await this.openAIProtocolLLMProvider.handleMessage(res, originalBody);
    }

    let endTime = performance.now();

    console.log(
      `Function execution took ${(endTime - startTime) / 1000} seconds.`,
    );
  }

  private parseCustomPrompt(msg: string) {
    let msgData = msg.split("|=|");
    return {
      is_thaumic: msgData[0] && msgData[1] && msgData[2],
      name: msgData[0],
      prompt: msgData[1],
      fallback_prompt: msgData[2],
    };
  }

  private async processUserMessage(msg: string) {
    return msg;
  }

  private async processSystemMessage(msg: string) {
    let msgData = this.parseCustomPrompt(msg);

    if (msgData.is_thaumic) {
      let data = await this.dataRepository.getAgentByName(msgData.name);

      // todo: check if message had delimeters and if not.. don't log name as some long msg.
      if (data.length > 1)
        console.warn(
          "Query for NPC returned more than one result. Using first.. but this is a problem.",
        );
      if (data.length == 0)
        console.warn(`Could not find NPC by the name of ${msgData.name}`);

      let characterData: ThaumaturgyAgent | null = null;
      if (data.length > 0) {
        characterData = new ThaumaturgyAgent(
          data[0].id,
          data[0].name,
          data[0].initial_persona_header,
          data[0].initial_persona,
        );
        console.log("Found NPC data", data);
      }

      return {
        agent_id: characterData ? characterData.id : null,
        user_message_prompt: msgData.prompt,
        updated_system_prompt: "", //msgData.prompt,
        fallback_prompt: msgData.fallback_prompt,
      };
    } else {
      return {
        agent_id: null,
        user_message_prompt: null,
        fallback_prompt: msg,
      };
    }
  }
}
