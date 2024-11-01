import { DataImportService } from "../../Core/Services/DataImportService";
import { MantellaImportFileProcessor } from "../../Infrastructure/Importer/MantellaImportFileProcessor";
import { IDataImportFileProcessor } from "../../Core/Interfaces/Importer/IDataImportFileProcessor";
import { IOpenAIProtocolLLMProvider } from "../../Core/Interfaces/IOpenAIProtocolLLMProvider";
import { ImportDomainData } from "../../Core/Data/Importer/ImportDomainData";
import { IMemGPTProvider } from "../../Core/Interfaces/IMemGPTProvider";
import { IDataRepository } from "../../Core/Interfaces/IDataRepository";
import { ImportMemoriesData } from "../../Core/Data/Importer/ImportMemoriesData";
import { IDataImportService } from "../../Core/Interfaces/Importer/IDataImportService";

export class DataImportController {
  private service: IDataImportService;

  constructor(
    private llmProvider: IOpenAIProtocolLLMProvider,
    private memGPTProvider: IMemGPTProvider,
    private dataRepository: IDataRepository,
  ) {
    this.service = new DataImportService(
      this.memGPTProvider,
      this.dataRepository,
      this.llmProvider,
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

  async importMemories(file: Express.Multer.File, data: ImportMemoriesData) {
    let fileProcessor: IDataImportFileProcessor;

    fileProcessor = new MantellaImportFileProcessor(this.llmProvider);
    await this.service.importMemories(file, data, fileProcessor);
  }
}
