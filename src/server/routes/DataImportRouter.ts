import { Application, Request, Response } from "express";
import multer from "multer";
import { HttpStatusCode } from "axios";
import { BaseRouter } from "./BaseRouter";
import { DataImportController } from "../controllers/DataImportController";
import { DataImportValidator } from "../validators/DataImportValidator";
import { IOpenAIProtocolLLMProvider } from "../../Core/Interfaces/IOpenAIProtocolLLMProvider";
import { ImportDomainData } from "../../Core/Data/Importer/ImportDomainData";
import { IMemGPTProvider } from "../../Core/Interfaces/IMemGPTProvider";
import { IDataRepository } from "../../Core/Interfaces/IDataRepository";

export class DataImportRouter extends BaseRouter {
  private controller: DataImportController;
  private validator: DataImportValidator;
  private upload = multer({ dest: `${process.cwd()}/tmp` });

  constructor(
    private app: Application,
    private openAIProtocolLLMProvider: IOpenAIProtocolLLMProvider,
    private memGPTProvider: IMemGPTProvider,
    private dataRepository: IDataRepository,
  ) {
    super();
    this.setupRoutes();

    this.controller = new DataImportController(
      this.openAIProtocolLLMProvider,
      this.memGPTProvider,
      this.dataRepository,
    );
    this.validator = new DataImportValidator();
  }

  private setupRoutes(): void {
    this.app.post(
      this.buildEndpoint("import"),
      this.upload.single("file"), // use multer middleware to handle file upload, 'file' is the field name
      async (req: Request, res: Response) => {
        try {
          let results = this.validator.validateImportDomainData(
            req.file,
            req.body as ImportDomainData,
          );

          if (!results.passed) {
            res.status(HttpStatusCode.BadRequest).send({ data: results.data });
            return;
          }

          await this.controller.importDomainData(
            req.file as Express.Multer.File,
            req.body as ImportDomainData,
          );

          res.send({ data: {} });
        } catch (e: any) {
          res
            .status(HttpStatusCode.InternalServerError)
            .send({ data: { error: e.message } });
        }
      },
    );
  }
}
