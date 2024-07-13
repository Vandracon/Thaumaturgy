import { ProcessedBio } from "../../Core/Data/Importer/ProcessedBio";
import { IDataImportFileProcessor } from "../../Core/Interfaces/Importer/IDataImportFileProcessor";
import fs from "fs";
import csv from "csv-parser";
import * as config from "config";
import { IOpenAIProtocolLLMProvider } from "../../Core/Interfaces/IOpenAIProtocolLLMProvider";
import { Message } from "../../Core/Data/OpenAIProtocol/LLMChatCompletionRequestBody";

export class MantellaImportFileProcessor implements IDataImportFileProcessor {
  constructor(private llmProvider: IOpenAIProtocolLLMProvider) {}
  private usedPersonaNames: Array<string> = [];
  private numBiosOriginallyOverLimit: number = 0;

  async process(
    file: Express.Multer.File,
    usePreviousFile: boolean,
    agentPersonaStarter: string,
  ): Promise<Array<ProcessedBio>> {
    let cachedFilePath = `${process.cwd()}/data/${config.IMPORTER.FILE_PROCESSED_PERSONAS}`;

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
    console.log(`Processing Bios ${i + 1} of ${total}`);

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

      var bio = agentPersonaStarter;
      bio += "\n\nRace: " + row["race"];
      bio += "\nGender: " + row["gender"];
      bio += "\nSpecies: " + row["species"];
      bio += "\n\nBio: " + row["bio"];

      var data: ProcessedBio = {
        name: name,
        text: bio,
      };

      if (data.text.length > 2000) {
        data.text = await this.summarizeBioUntilSatisfied(data.text);
      }

      // If it's still bad after trying so much.. we have to abort.
      if (data.text.length > 2000) {
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
    const response = await this.llmProvider.chatToLLM(
      `Summarize this character bio to be at or under 2000 character length: ${bio}`,
      450,
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
    numRuns: number = 0,
  ): Promise<string> {
    if (text.length > 2000 || text.length == 0) {
      if (numRuns == 0) this.numBiosOriginallyOverLimit++;

      let summarizedText = await this.summarizeBio(text);
      numRuns++;

      // We can't bug the LLM forever. The model used can't seem to give us the summary we need.
      if (numRuns > config.IMPORTER.MAX_TRIES_BIO_SUMMARY) {
        return text;
      }

      // Call the function recursively with the summarized text
      return this.summarizeBioUntilSatisfied(summarizedText, numRuns);
    } else {
      return text;
    }
  }
}
