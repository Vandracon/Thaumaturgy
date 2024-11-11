import { SetFilteringData } from "../../Core/Data/OpenAIProtocol/SetFilteringData";
import { BaseValidator } from "./BaseValidator";

export class OpenAIProtocolValidator extends BaseValidator {
  validateSetFiltering(data: SetFilteringData) {
    let validationReasons: Array<string> = [];

    if (!Array.isArray(data.data)) {
      validationReasons.push(`data must be an array of Filter objects`);
    } else {
      data.data.forEach((filter, index) => {
        if (!filter.find || typeof filter.find !== "string") {
          validationReasons.push(
            `Filter at index ${index} is missing a valid regex string`,
          );
        }
        if (typeof filter.replace !== "string") {
          validationReasons.push(
            `Filter at index ${index} is missing a valid replacement string`,
          );
        }
      });
    }

    return this.returnResult(validationReasons.length === 0, validationReasons);
  }
}
