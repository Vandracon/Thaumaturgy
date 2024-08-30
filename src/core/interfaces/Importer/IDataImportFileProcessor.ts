import { ExtractSummariesData } from "../../Data/Importer/ExtractSummariesData";
import { ProcessedBio } from "../../Data/Importer/ProcessedBio";

export interface IDataImportFileProcessor {
  process(
    file: Express.Multer.File,
    usePreviousFile: boolean,
    agentPersonaStarter: string,
    domain: string,
  ): Promise<Array<ProcessedBio>>;

  extractSummariesFromFile(file: Express.Multer.File): ExtractSummariesData;

  getProcessedBioFromCharactersCSVData(
    uid: string,
  ): Promise<ProcessedBio | null>;
}
