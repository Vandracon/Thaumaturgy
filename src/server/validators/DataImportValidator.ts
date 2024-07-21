import { ImportDomainData } from "../../Core/Data/Importer/ImportDomainData";
import * as fs from "fs";
import { ImportMemoriesData } from "../../Core/Data/Importer/ImportMemoriesData";
import { BaseValidator, ValidationResult } from "./BaseValidator";

export class DataImportValidator extends BaseValidator {
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

    if (!data.use_previously_imported_personas)
      validationReasons.push(`Missing use_previously_processed_bios_file`);
    else {
      data.use_previously_imported_personas =
        (data.use_previously_imported_personas as unknown) == "true"
          ? (data.use_previously_imported_personas = true)
          : (data.use_previously_imported_personas = false);
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
    return this.returnResult(
      validationReasons.length ? false : true,
      validationReasons,
    );
  }

  validateMemoryImport(
    file: Express.Multer.File | undefined,
    data: ImportMemoriesData,
  ): ValidationResult {
    let validationReasons: Array<string> = [];

    if (!file) validationReasons.push(`File not provided`);
    else if (!fs.existsSync(file.path))
      validationReasons.push(`Uploaded file was not found. Internal Error`);

    if (!data.character_name)
      validationReasons.push(`No character_name provided`);

    data.override_summaries_generation =
      (data.override_summaries_generation as unknown) == "true";

    if (data.override_summaries_generation) {
      if (data.core_persona_memory_override) {
        if (data.core_persona_memory_override.length == 0)
          validationReasons.push(`core_persona_memory_override can't be empty`);
      }

      if (data.core_human_memory_override) {
        if (data.core_human_memory_override.length == 0)
          validationReasons.push(`core_human_memory_override can't be empty`);
      }
    }

    // End of checks
    return this.returnResult(
      validationReasons.length ? false : true,
      validationReasons,
    );
  }
}
