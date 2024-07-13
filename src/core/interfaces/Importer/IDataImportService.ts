import { ImportDomainData } from "../../Data/Importer/ImportDomainData";
import { IDataImportFileProcessor } from "./IDataImportFileProcessor";

export interface IDataImportService {
  importDomainData(
    file: Express.Multer.File,
    data: ImportDomainData,
    fileProcessor: IDataImportFileProcessor,
  ): Promise<void>;
}
