import { PagingRequest } from "../../Core/Data/PagingRequest";
import { BaseValidator } from "./BaseValidator";

export class CommonValidator extends BaseValidator {
  validatePagingRequest(query: PagingRequest) {
    let validationReasons: Array<string> = [];

    if (!query.page || (query.page && typeof query.page != "string")) {
      validationReasons.push(`page query param missing or invalid`);
    }

    if (
      !query.pageSize ||
      (query.pageSize && typeof query.pageSize != "string")
    ) {
      validationReasons.push(`pageSize query param missing or invalid`);
    }

    // Convert to number
    query.page = Number(query.page);
    query.pageSize = Number(query.pageSize);

    return this.returnResult(
      validationReasons.length ? false : true,
      validationReasons,
    );
  }
}
