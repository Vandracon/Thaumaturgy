import { DataImportService } from "../../Core/Services/DataImportService";
import { MantellaImportFileProcessor } from "../../Infrastructure/Importer/MantellaImportFileProcessor";
import { IDataImportFileProcessor } from "../../Core/Interfaces/Importer/IDataImportFileProcessor";
import { IOpenAIProtocolLLMProvider } from "../../Core/Interfaces/IOpenAIProtocolLLMProvider";
import { ImportDomainData } from "../../Core/Data/Importer/ImportDomainData";
import { IMemGPTProvider } from "../../Core/Interfaces/IMemGPTProvider";
import { IDataRepository } from "../../Core/Interfaces/IDataRepository";

export class DataImportController {
  private service: DataImportService;

  constructor(
    private llmProvider: IOpenAIProtocolLLMProvider,
    private memGPTProvider: IMemGPTProvider,
    private dataRepository: IDataRepository,
  ) {
    this.service = new DataImportService(
      this.memGPTProvider,
      this.dataRepository,
    );
  }

  async importDomainData(
    file: Express.Multer.File,
    data: ImportDomainData,
  ): Promise<void> {
    let fileProcessor: IDataImportFileProcessor;
    switch (data.import_type) {
      case "mantella":
        fileProcessor = new MantellaImportFileProcessor(this.llmProvider);
        break;
      default:
        throw new Error(`Unhandled import type ${data.import_type}`);
    }

    await this.service.importDomainData(file, data, fileProcessor);
  }
}
