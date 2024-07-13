import { ProcessedBio } from "../../Data/Importer/ProcessedBio";

export interface IDataImportFileProcessor {
  process(
    file: Express.Multer.File,
    usePreviousFile: boolean,
    agentPersonaStarter: string,
  ): Promise<Array<ProcessedBio>>;
}
