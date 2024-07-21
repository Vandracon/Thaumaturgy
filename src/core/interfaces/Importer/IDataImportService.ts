import { ImportDomainData } from "../../Data/Importer/ImportDomainData";
import { ImportMemoriesData } from "../../Data/Importer/ImportMemoriesData";
import { IDataImportFileProcessor } from "./IDataImportFileProcessor";

export interface IDataImportService {
  importDomainData(
    file: Express.Multer.File,
    data: ImportDomainData,
    fileProcessor: IDataImportFileProcessor,
  ): Promise<void>;

  importMemories(
    summariesFile: Express.Multer.File,
    data: ImportMemoriesData,
    fileProcessor: IDataImportFileProcessor,
  ): Promise<void>;
}
