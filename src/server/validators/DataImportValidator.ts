import { ImportDomainData } from "../../Core/Data/Importer/ImportDomainData";

// todo: move
export class ValidationResult {
  constructor(
    public passed: boolean,
    public data: any,
  ) {}
}

// todo: do actual validation when body is figured out
export class DataImportValidator {
  validateImportDomainData(
    file: Express.Multer.File | undefined,
    data: ImportDomainData,
  ): ValidationResult {
    let validationReasons: Array<string> = [];
    let supportedImportTypes = ["mantella"];

    if (!supportedImportTypes.includes(data.import_type)) {
      validationReasons.push(
        `Unsupported import_type ${data.import_type}. Supported types are: ${supportedImportTypes}`,
      );
    }

    if (!file) {
      validationReasons.push(`No file provided`);
    }

    if (!data.agent_persona_starter)
      validationReasons.push(`Missing agent_persona_starter`);

    if (!data.use_previously_processed_bios_file)
      validationReasons.push(`Missing use_previously_processed_bios_file`);
    else {
      data.use_previously_processed_bios_file =
        (data.use_previously_processed_bios_file as unknown) == "true"
          ? (data.use_previously_processed_bios_file = true)
          : (data.use_previously_processed_bios_file = false);
    }

    if (!data.create_user_template)
      validationReasons.push(`Missing create_user_template`);
    else {
      data.create_user_template =
        (data.create_user_template as unknown) == "true"
          ? (data.create_user_template = true)
          : (data.create_user_template = false);
    }

    if (!data.domain) validationReasons.push(`Missing domain`);
    if (!data.player_starter_memory)
      validationReasons.push(`Missing player_starter_memory`);

    // End of checks

    if (validationReasons.length) {
      return this.returnResult(false, validationReasons);
    }

    return this.returnResult(true, validationReasons);
  }

  private returnResult(passed: boolean, data: Array<string>) {
    return new ValidationResult(passed, data);
  }
}
