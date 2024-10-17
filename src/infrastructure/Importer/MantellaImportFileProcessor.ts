import { ProcessedBio } from "../../Core/Data/Importer/ProcessedBio";
import { IDataImportFileProcessor } from "../../Core/Interfaces/Importer/IDataImportFileProcessor";
import fs from "fs";
import csv from "csv-parser";
import * as config from "config";
import { IOpenAIProtocolLLMProvider } from "../../Core/Interfaces/IOpenAIProtocolLLMProvider";
import { Message } from "../../Core/Data/OpenAIProtocol/LLMChatCompletionRequestBody";
import { ExtractSummariesData } from "../../Core/Data/Importer/ExtractSummariesData";
import { Utility } from "../../Core/Utils/Utility";

export class MantellaImportFileProcessor implements IDataImportFileProcessor {
  constructor(private llmProvider: IOpenAIProtocolLLMProvider) {}
  private usedPersonaNames: Array<string> = [];
  private numBiosOriginallyOverLimit: number = 0;

  async process(
    file: Express.Multer.File,
    usePreviousFile: boolean,
    agentPersonaStarter: string,
    domain: string,
  ): Promise<Array<ProcessedBio>> {
    let cachedFilePath = `${process.cwd()}/data/domain/${domain}/${config.IMPORTER.FILE_PROCESSED_PERSONAS}`;

    this.usedPersonaNames = [];
    this.numBiosOriginallyOverLimit = 0;
    let results: Array<ProcessedBio> = [];
    let total = 0;

    if (usePreviousFile) {
      console.log(
        `Using previous persona file instead of generating a new one ${cachedFilePath}`,
      );

      if (fs.existsSync(cachedFilePath)) {
        let fileContent = fs.readFileSync(cachedFilePath, "utf8");
        let fileData = JSON.parse(fileContent);
        for (let f of fileData) {
          results.push(f);
        }

        return results;
      } else {
        console.log("There was no cached file found.. processing this new one");
      }
    }

    let rows = await new Promise<any>((resolve, reject) => {
      let x: Array<any> = [];
      fs.createReadStream(file.path)
        .pipe(csv())
        .on("data", (data) => x.push(data))
        .on("error", (error) => reject(error))
        .on("end", () => {
          resolve(x);
        });
    });

    total = rows.length;
    let i = 0;
    for (const row of rows) {
      results.push(await this.processRow(row, i, total, agentPersonaStarter));
      i++;
    }
    await this.saveProcessedPersonas(results, cachedFilePath);
    return results;
  }

  async saveProcessedPersonas(data: Array<ProcessedBio>, path: string) {
    try {
      await fs.promises.writeFile(path, JSON.stringify(data), "utf-8");
      console.log(`Data has been written to file at ${path}`);
    } catch (error) {
      console.error(`Error writing data to file: ${error}`);
    }
  }

  async processRow(
    row: any,
    i: number,
    total: number,
    agentPersonaStarter: string,
  ): Promise<ProcessedBio> {
    let log = `Processing Bios ${i + 1} of ${total}`;
    Utility.LastImportStatusUpdate = log;
    console.log(log);

    try {
      var keys = Object.keys(row);
      var name = row[keys[0]];

      var counter = 1;
      // todo: switch to ref_id/base_id or w/e
      while (this.usedPersonaNames.includes(name)) {
        name = `${row[keys[0]]}_${counter}`;
        counter++;
      }
      this.usedPersonaNames.push(name);

      var personaHeader = agentPersonaStarter;
      personaHeader += "\n\nRace: " + row["race"];
      personaHeader += "\nGender: " + row["gender"];
      personaHeader += "\nSpecies: " + row["species"];
      personaHeader += "\n\nBio: ";

      var data: ProcessedBio = {
        name: name,
        persona_header: personaHeader,
        persona: row["bio"],
      };

      let personaCharLimit =
        config.MEMGPT.CORE_MEMORY_PERSONA_CHARACTER_LIMIT -
        data.persona_header.length;

      if (data.persona.length > personaCharLimit) {
        data.persona = await this.summarizeBioUntilSatisfied(
          data.persona,
          data.persona,
          personaCharLimit,
        );
      }

      // If it's still bad after trying so much.. we have to abort.
      if (data.persona.length > personaCharLimit) {
        throw new Error(
          `LLM was unable to summarize bio to acceptable length after ${config.IMPORTER.MAX_TRIES_BIO_SUMMARY} tries. Aborting`,
        );
      }

      return data;
    } catch (e) {
      throw e;
    }
  }

  private async summarizeBio(bio: string) {
    const response = await this.llmProvider.simpleUserRequestToLLM(
      `Extract the most important information from the following text and present it in an extended summary (2 paragraphs):`,
      `${bio}`,
      config.LLM.MAX_TOKENS_FOR_CORE_MEMORY_BANK,
    );
    var msg = response.choices[0].message as Message;
    console.log(
      "\n\n***Before Summary:\n",
      bio,
      "\n\n***After Summary:\n",
      msg.content,
      "\n",
    );
    console.log(
      "Original Summary Length",
      bio.length,
      "New Summary Length",
      msg.content.length,
      "\n",
    );
    return msg.content;
  }

  private async summarizeBioUntilSatisfied(
    text: string,
    originalText: string,
    limit: number,
    numRuns: number = 0,
  ): Promise<string> {
    if (text.length > limit || text.length == 0) {
      if (numRuns == 0) this.numBiosOriginallyOverLimit++;

      let summarizedText = await this.summarizeBio(originalText);
      numRuns++;

      // We can't bug the LLM forever. The model used can't seem to give us the summary we need.
      if (numRuns > config.IMPORTER.MAX_TRIES_BIO_SUMMARY) {
        console.log(`Summary failed after ${numRuns} tries.`);
        return text;
      }

      // Call the function recursively with the summarized text
      return this.summarizeBioUntilSatisfied(
        summarizedText,
        originalText,
        limit,
        numRuns,
      );
    } else {
      return text;
    }
  }

  extractSummariesFromFile(file: Express.Multer.File): ExtractSummariesData {
    let fileContent = fs.readFileSync(file.path, "utf8");
    let fileData: Array<string> = fileContent.split("\n");
    let results: Array<string> = [];

    // Process text
    for (let t of fileData) {
      t = t.replace("\r", "");
      if (t.length) results.push(t);
    }

    return {
      original: fileContent,
      summaries: results,
    };
  }

  async getProcessedBioFromCharactersCSVData(
    uid: string,
  ): Promise<ProcessedBio | null> {
    try {
      let path = `${process.cwd()}/${config.MISC.MANTELLA.CHARACTERS_CSV_PATH}`;
      let rows = await new Promise<any>((resolve, reject) => {
        let x: Array<any> = [];

        if (fs.existsSync(path)) {
          fs.createReadStream(path)
            .pipe(csv())
            .on("data", (data) => x.push(data))
            .on("error", (error) => reject(error))
            .on("end", () => {
              resolve(x);
            });
        } else reject();
      });

      if (rows && rows.length) {
        for (let row of rows) {
          var keys = Object.keys(row);
          var name = row[keys[0]];

          if (name == uid) {
            return await this.processRow(row, 0, 10, `I exist in Skyrim.`);
          }
        }
      }
    } catch (e) {
      console.warn("There was no characters csv file provided");
    }

    return null;
  }
}
