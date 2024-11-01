import { IDataImportService } from "../Interfaces/Importer/IDataImportService";
import { IDataImportFileProcessor } from "../Interfaces/Importer/IDataImportFileProcessor";
import { ProcessedBio } from "../Data/Importer/ProcessedBio";
import { IMemGPTProvider } from "../Interfaces/IMemGPTProvider";
import { ImportDomainData } from "../Data/Importer/ImportDomainData";
import { Agent, ThaumaturgyAgent } from "../Entities/Agent";
import * as config from "config";
import { IDataRepository } from "../Interfaces/IDataRepository";
import { ImportMemoriesData } from "../Data/Importer/ImportMemoriesData";
import { IOpenAIProtocolLLMProvider } from "../Interfaces/IOpenAIProtocolLLMProvider";
import { Message } from "../Data/OpenAIProtocol/LLMChatCompletionRequestBody";
import { Utility } from "../Utils/Utility";
import { ExtractSummariesData } from "../Data/Importer/ExtractSummariesData";

export class DataImportService implements IDataImportService {
  constructor(
    private memgptProvider: IMemGPTProvider,
    private dataRepository: IDataRepository,
    private openAIProtocolLLMProvider: IOpenAIProtocolLLMProvider,
  ) {}

  async importDomainData(
    file: Express.Multer.File,
    data: ImportDomainData,
    fileProcessor: IDataImportFileProcessor,
  ): Promise<void> {
    let domain = data.domain.toLowerCase();
    //let name = `${domain}_chat`;
    //let systemName = `${domain}_chat`;
    let human = data.player_starter_memory;
    let humanName = `${domain}_character`;

    Utility.LastImportStatusUpdate = "Processing Bios";
    let processedBios: Array<ProcessedBio> = await fileProcessor.process(
      file,
      data.use_previously_processed_bios_file,
      data.agent_persona_starter,
      domain,
    );

    if (!data.use_previously_imported_personas) {
      Utility.LastImportStatusUpdate = "Creating Personas";
      let createPersonasResponses =
        await this.memgptProvider.createPersonas(processedBios);

      await this.dataRepository.saveCreatedPersonasAnalytics(
        createPersonasResponses,
      );
    }

    if (data.create_user_template == true) {
      Utility.LastImportStatusUpdate = "Creating User Default Persona";
      await this.memgptProvider.createUserTemplate(
        humanName,
        data.player_starter_memory,
        domain,
      );
    }

    // await this.memgptProvider.createPreset(
    //   new Preset(
    //     name,
    //     systemName,
    //     human,
    //     humanName,
    //     config.MEMGPT.FUNCTIONS_SCHEMA,
    //   ),
    // );

    let systemPrompt = Utility.getSystemPromptSync();

    console.log(
      `System prompt length: ${systemPrompt.length} \n\n${systemPrompt}`,
    );

    let agents: Array<Agent> = [];
    processedBios.forEach((bio) => {
      agents.push(
        new Agent(
          bio.name,
          humanName,
          human,
          bio.name,
          bio.persona_header + bio.persona,
          config.LLM.MODEL_NAME,
          config.MEMGPT.FUNCTIONS_SCHEMA,
        ),
      );
    });

    let createAgentResponses = await this.memgptProvider.createAgents(
      agents,
      systemPrompt,
    );

    await this.dataRepository.saveCreatedAgentsAnalytics(createAgentResponses);

    let thaumAgents: Array<ThaumaturgyAgent> = [];
    for (let i = 0; i < createAgentResponses.length; i++) {
      thaumAgents.push(
        new ThaumaturgyAgent(
          createAgentResponses[i].agent_state.id,
          createAgentResponses[i].agent_state.name,
          processedBios[i].persona_header,
          processedBios[i].persona,
        ),
      );
    }

    await this.dataRepository.saveCreatedAgentsToDatabase(thaumAgents);

    let log = `Imported ${processedBios.length} agents successfully`;
    Utility.LastImportStatusUpdate = log + " STATUS_END";
    console.log(log);
  }

  async importMemories(
    summariesFile: Express.Multer.File,
    data: ImportMemoriesData,
    fileProcessor: IDataImportFileProcessor,
  ): Promise<void> {
    let newCoreMemoryPersonaLLMResponse = "";
    let newCoreMemoryHumanLLMResponse = "";

    // Step - Lookup agent by character name
    let agents = await this.dataRepository.getAgentByName(data.character_name);

    if (!agents.length)
      throw new Error(
        `Agent not found by character name ${data.character_name}`,
      );
    else if (agents.length > 1)
      throw new Error(
        `Found more than one agent by the name ${data.character_name}. This should never occur.`,
      );
    let agent = agents[0];

    // Step - Take single text file of chat summaries (user must combine their files and split them with a newline).
    let extractedSummariesData: ExtractSummariesData = {
      original: "",
      summaries: [],
    };

    if (summariesFile) fileProcessor.extractSummariesFromFile(summariesFile);
    for (let s of extractedSummariesData.summaries) {
      console.log([s]);
    }

    // User can override the summaries generation by providing the data without a file.
    if (data.override_summaries_generation === false) {
      // Step - Get agent's core memories.
      let coreMemories = await this.memgptProvider.getCoreMemory(agent.id);

      console.log(
        `Found agent: ${JSON.stringify(agent)}\n\nFound core memories ${JSON.stringify(coreMemories)}`,
      );

      // Step - Ask LLM to summarize and split the summary into persona and what agent knows about the human.
      let agentPersona = agent.initial_persona_header + agent.initial_persona;

      let personaAndSummary = `Persona:\n\n${agentPersona}\n\nSummary:\n\n${extractedSummariesData.original}`;

      // When getting a new persona (Core memory persona), include the old one as well as the received summary information to combine into a new persona.
      let that = this;
      async function getNewCoreMemoryPersona(
        numTries: number = 0,
      ): Promise<string> {
        let newCoreMemoryPersonaLLMResponse =
          await that.openAIProtocolLLMProvider.simpleUserRequestToLLM(
            "Given this persona and summary, extract your personality from your point of view. Write as if it was describing your character in your own thoughts. " +
              'Avoid starting with "in this description", or "from the text", as its not first person:',
            personaAndSummary,
            config.LLM.MAX_TOKENS_FOR_CORE_MEMORY_BANK,
            null,
            0,
            null,
            0.5,
            1,
          );
        numTries++;

        let newCoreMemoryPersonaResult =
          agent.initial_persona_header +
          (newCoreMemoryPersonaLLMResponse.choices[0].message as Message)
            .content;

        if (
          newCoreMemoryPersonaResult.length >
          config.MEMGPT.CORE_MEMORY_PERSONA_CHARACTER_LIMIT
        ) {
          if (numTries > config.IMPORTER.MAX_TRIES_MEMORY_IMPORT)
            return newCoreMemoryPersonaResult;
          return getNewCoreMemoryPersona(numTries);
        } else {
          return newCoreMemoryPersonaResult;
        }
      }

      newCoreMemoryPersonaLLMResponse = await getNewCoreMemoryPersona();

      if (
        newCoreMemoryPersonaLLMResponse.length >
        config.MEMGPT.CORE_MEMORY_PERSONA_CHARACTER_LIMIT
      ) {
        throw new Error(
          `Unable to summarize new persona core memory after ${config.IMPORTER.MAX_TRIES_BIO_SUMMARY} tries.`,
        );
      }

      // When getting new user summary (Core memory human), include just the summary as we just want key elements extracted for what the agent knows about the user.
      async function getNewCoreMemoryHuman(
        numTries: number = 0,
      ): Promise<string> {
        let newCoreMemoryHumanLLMResponse =
          await that.openAIProtocolLLMProvider.simpleUserRequestToLLM(
            "Given your persona and summary, summarize at length the following text and extract your knowledge of the human/player. You must " +
              "list out facts line by line starting with a hyphen that will be stored in your memory:",
            extractedSummariesData.original,
            config.LLM.MAX_TOKENS_FOR_CORE_MEMORY_BANK,
            null,
            0,
            null,
            0.5,
            1,
          );
        numTries++;

        let newCoreMemoryHumanResult = (
          newCoreMemoryHumanLLMResponse.choices[0].message as Message
        ).content;

        if (
          newCoreMemoryHumanResult.length >
          config.MEMGPT.CORE_MEMORY_HUMAN_CHARACTER_LIMIT
        ) {
          if (numTries > config.IMPORTER.MAX_TRIES_MEMORY_IMPORT)
            return newCoreMemoryHumanResult;
          return getNewCoreMemoryHuman(numTries);
        } else {
          return newCoreMemoryHumanResult;
        }
      }

      newCoreMemoryHumanLLMResponse = await getNewCoreMemoryHuman();

      if (
        newCoreMemoryHumanLLMResponse.length >
        config.MEMGPT.CORE_MEMORY_HUMAN_CHARACTER_LIMIT
      ) {
        throw new Error(
          `Unable to summarize new persona core memory after ${config.IMPORTER.MAX_TRIES_BIO_SUMMARY} tries.`,
        );
      }
    } else {
      newCoreMemoryPersonaLLMResponse =
        data.core_persona_memory_override as string;
      newCoreMemoryHumanLLMResponse = data.core_human_memory_override as string;
    }

    console.log(
      `\nNew persona core memory:\n${newCoreMemoryPersonaLLMResponse}`,
    );
    console.log(`\nNew human core memory:\n${newCoreMemoryHumanLLMResponse}`);

    // Step - Overwrite agent core memories with this split summary (with the same header prepended ie. race, name, gender, etc).
    console.log(`\nUpdating core memories of ${agent.name}`);
    await this.memgptProvider.updateCoreMemory(
      agent.id,
      newCoreMemoryHumanLLMResponse,
      newCoreMemoryPersonaLLMResponse,
    );

    // Step - Split the summary into chunks and inject them into archival memory.
    console.log(`Injecting summaries into archival memory`);
    for (let summary of extractedSummariesData.summaries) {
      await this.memgptProvider.addToArchivalMemory(
        agent.id,
        `[old days] - ${summary}`,
      );
    }

    console.log("Memories imported!");
  }
}
