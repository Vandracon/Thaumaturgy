import { LLMConfig } from "../../Core/Data/MemGPT/Mod/LLMConfig";
import { UpdateAgentLLMConfig } from "../../Core/Data/MemGPT/Mod/UpdateAgentLLMConfig";
import { UpdateAllAgentLLMConfig } from "../../Core/Data/MemGPT/Mod/UpdateAllAgentLLMConfig";
import { BaseValidator } from "./BaseValidator";

export class MemGPTModValidator extends BaseValidator {
  validateUpdateAgentLLMConfig(data: UpdateAgentLLMConfig) {
    let validationReasons: Array<string> = [];

    if (!data.agent_id || (data.agent_id && typeof data.agent_id != "string")) {
      validationReasons.push(`agent_id missing or is not a string value`);
    }

    validationReasons = this.validateLLMConfig(
      data.llm_config,
      validationReasons,
    );

    return this.returnResult(
      validationReasons.length ? false : true,
      validationReasons,
    );
  }

  validateUpdateAgentsLLMConfig(data: UpdateAllAgentLLMConfig) {
    let validationReasons: Array<string> = [];

    validationReasons = this.validateLLMConfig(
      data.llm_config,
      validationReasons,
    );

    return this.returnResult(
      validationReasons.length ? false : true,
      validationReasons,
    );
  }

  private validateLLMConfig(data: LLMConfig, validationReasons: Array<string>) {
    let providedFields = 0;

    if (data.model) {
      providedFields++;
      if (typeof data.model != "string") {
        validationReasons.push(`model should be a string value`);
      }
    }

    if (data.model == null) {
      // null allowed for this field
      providedFields++;
    }

    if (data.model_endpoint_type) {
      providedFields++;
      if (typeof data.model_endpoint_type != "string") {
        validationReasons.push(`model_endpoint_type should be a string value`);
      }
    }

    if (data.model_endpoint) {
      providedFields++;
      if (typeof data.model_endpoint != "string") {
        validationReasons.push(`model_endpoint should be a string value`);
      }
    }

    if (data.model_wrapper) {
      providedFields++;
      if (typeof data.model_wrapper != "string") {
        validationReasons.push(`model_wrapper should be a string value`);
      }
    }

    if (typeof data.context_window == "number") {
      providedFields++;
    }

    if (providedFields == 0)
      validationReasons.push(`No fields provided to update`);

    return validationReasons;
  }
}
