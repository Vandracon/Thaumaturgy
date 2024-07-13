import { IDataImportService } from "../Interfaces/Importer/IDataImportService";
import { IDataImportFileProcessor } from "../Interfaces/Importer/IDataImportFileProcessor";
import { ProcessedBio } from "../Data/Importer/ProcessedBio";
import { IMemGPTProvider } from "../Interfaces/IMemGPTProvider";
import { ImportDomainData } from "../Data/Importer/ImportDomainData";
import { Preset } from "../Entities/Preset";
import { Agent, ThaumaturgyAgent } from "../Entities/Agent";
import * as config from "config";
import { IDataRepository } from "../Interfaces/IDataRepository";

export class DataImportService implements IDataImportService {
  constructor(
    private memgptProvider: IMemGPTProvider,
    private dataRepository: IDataRepository,
  ) {}

  async importDomainData(
    file: Express.Multer.File,
    data: ImportDomainData,
    fileProcessor: IDataImportFileProcessor,
  ): Promise<void> {
    let name = `${data.domain.toLowerCase()}_chat`;
    let systemName = `${data.domain.toLowerCase()}_chat`;
    let human = data.player_starter_memory;
    let humanName = `${data.domain.toLowerCase()}_character`;

    let processedBios: Array<ProcessedBio> = await fileProcessor.process(
      file,
      data.use_previously_processed_bios_file,
      data.agent_persona_starter,
    );

    processedBios = processedBios.slice(0, 20);

    console.log(processedBios);

    let createPersonasResponses =
      await this.memgptProvider.createPersonas(processedBios);

    await this.dataRepository.saveCreatedPersonasAnalytics(
      createPersonasResponses,
    );

    if (data.create_user_template == true) {
      await this.memgptProvider.createUserTemplate(
        humanName,
        data.player_starter_memory,
      );
    }

    await this.memgptProvider.createPreset(
      new Preset(
        name,
        systemName,
        human,
        humanName,
        config.MEMGPT.FUNCTIONS_SCHEMA,
      ),
    );

    let agents: Array<Agent> = [];
    processedBios.forEach((bio) => {
      agents.push(
        new Agent(
          bio.name,
          humanName,
          human,
          bio.name,
          bio.text,
          "",
          config.MEMGPT.FUNCTIONS_SCHEMA,
          name,
        ),
      );
    });

    let createAgentResponses = await this.memgptProvider.createAgents(agents);

    await this.dataRepository.saveCreatedAgentsAnalytics(createAgentResponses);

    let thaumAgents: Array<ThaumaturgyAgent> = [];
    for (let i = 0; i < createAgentResponses.length; i++) {
      thaumAgents.push(
        new ThaumaturgyAgent(
          createAgentResponses[i].agent_state.id,
          createAgentResponses[i].agent_state.name,
          processedBios[i].text,
        ),
      );
    }

    await this.dataRepository.saveCreatedAgentsToDatabase(thaumAgents);

    console.log(`Imported ${processedBios.length} agents successfully`);
  }
}
