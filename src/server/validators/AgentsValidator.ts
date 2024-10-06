import { Request } from "express";
import { ChatRequest } from "../../Core/Data/Agents/ChatRequest";
import { CreateAgentRequest } from "../../Core/Data/Agents/CreateAgentRequest";
import { UpdateAgentMemoryRequest } from "../../Core/Data/Agents/UpdateAgentMemoryRequest";
import { PagingRequest } from "../../Core/Data/PagingRequest";
import { BaseValidator } from "./BaseValidator";
import { CommonValidator } from "./CommonValidator";

export class AgentsValidator extends BaseValidator {
  private commonValidator: CommonValidator;

  constructor() {
    super();
    this.commonValidator = new CommonValidator();
  }

  validatePagingRequest(query: PagingRequest) {
    return this.commonValidator.validatePagingRequest(query);
  }

  validateAgentMemoryUpdateRequest(
    agentId: string,
    body: UpdateAgentMemoryRequest,
  ) {
    let validationReasons: Array<string> = [];

    if (!agentId || typeof agentId !== "string")
      validationReasons.push("Invalid agentID provided in query params {:id}");
    if (typeof body.persona !== "string")
      validationReasons.push("Invalid persona memory provided");
    if (typeof body.human !== "string")
      validationReasons.push("Invalid human memory provided");

    return this.returnResult(
      validationReasons.length ? false : true,
      validationReasons,
    );
  }

  validateCreateAgentRequest(data: CreateAgentRequest) {
    let validationReasons: Array<string> = [];

    // Validate 'config' object exists
    if (!data.config) {
      validationReasons.push("Missing 'config' object");
    } else {
      // Validate 'name'
      if (!data.config.name || data.config.name.trim() === "") {
        validationReasons.push("Invalid or missing 'name' in config");
      }

      // Validate 'human_name'
      if (!data.config.human_name || data.config.human_name.trim() === "") {
        validationReasons.push("Invalid or missing 'human_name' in config");
      }

      // Validate 'human'
      if (data.config.human != "") {
        validationReasons.push("Invalid or missing 'human' in config");
      }

      // Validate 'persona_name'
      if (!data.config.persona_name || data.config.persona_name.trim() === "") {
        validationReasons.push("Invalid or missing 'persona_name' in config");
      }

      // Validate 'persona'
      if (data.config.persona != "") {
        validationReasons.push("Invalid or missing 'persona' in config");
      }

      // Validate 'model'
      if (data.config.model != "") {
        validationReasons.push("Invalid or missing 'model' in config");
      }

      // Validate 'function_names' (comma-separated string)
      if (
        !data.config.function_names ||
        data.config.function_names.trim() === ""
      ) {
        validationReasons.push("Invalid or missing 'function_names' in config");
      } else {
        // Check if function_names has valid entries
        const functionArray = data.config.function_names
          .split(",")
          .map((fn) => fn.trim());
        if (
          functionArray.length === 0 ||
          functionArray.some((fn) => fn === "")
        ) {
          validationReasons.push(
            "Invalid 'function_names' format, must be a comma-separated list of function names",
          );
        }
      }

      // Validate 'system' (must be null)
      if (data.config.system !== null) {
        validationReasons.push("'system' must be null");
      }
    }

    return this.returnResult(
      validationReasons.length ? false : true,
      validationReasons,
    );
  }

  validateConversationRequest(body: ChatRequest) {
    let validationReasons: Array<string> = [];

    if (!body.message || typeof body.message !== "string") {
      validationReasons.push("Invalid message provided");
    }

    return this.returnResult(
      validationReasons.length ? false : true,
      validationReasons,
    );
  }

  validateChatHistoryRequest(req: Request) {
    let validationReasons: Array<string> = [];

    if (!req.params.id || typeof req.params.id !== "string") {
      validationReasons.push("Invalid id provided");
    }

    if (!req.query.start || typeof req.query.start !== "string") {
      validationReasons.push("Invalid start provided");
    }

    if (!req.query.count || typeof req.query.count !== "string") {
      validationReasons.push("Invalid count provided");
    }

    return this.returnResult(
      validationReasons.length ? false : true,
      validationReasons,
    );
  }
}
