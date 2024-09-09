import { LLMConfig } from "../../Core/Data/MemGPT/Mod/LLMConfig";
import { IDatabaseClient } from "../../Core/Interfaces/IDatabaseClient";

export interface IMemGPTMod {
  updateAgentLLMSettings(agentId: string, config: LLMConfig): Promise<void>;
  updateAllAgentLLMSettings(config: LLMConfig): Promise<void>;
  updateAgentBaseSystemPrompt(
    agentId: string,
    newPrompt: string,
  ): Promise<void>;
  updateAllAgentsBaseSystemPrompt(newPrompt: string): Promise<void>;
}

/*
    Logic here is considered more of a mod to MemGPT. The reason is because it can go beyond the public API
    that it provides and may do direct database edits and/or other edits to that system. It is likely that
    if maintenance with upgrading versions is needed, these functions will need testing as they could
    be more likely to break.
*/
export class MemGPTMod implements IMemGPTMod {
  constructor(private dbClient: IDatabaseClient) {}

  async updateAgentLLMSettings(
    agentId: string,
    config: LLMConfig,
  ): Promise<void> {
    if (config.model != null) {
      let sql = `UPDATE agents SET llm_config = json_set(llm_config, '$.model', ?) WHERE id = ?`;
      await this.dbClient.insertData(sql, [config.model, agentId]);
    } else {
      let sql = `UPDATE agents SET llm_config = json_set(llm_config, '$.model', NULL) WHERE id = ?`;
      await this.dbClient.insertData(sql, [agentId]);
    }

    if (config.model_endpoint_type != null) {
      let sql = `UPDATE agents SET llm_config = json_set(llm_config, '$.model_endpoint_type', ?) WHERE id = ?`;
      await this.dbClient.insertData(sql, [
        config.model_endpoint_type,
        agentId,
      ]);
    }

    if (config.model_endpoint != null) {
      let sql = `UPDATE agents SET llm_config = json_set(llm_config, '$.model_endpoint', ?) WHERE id = ?`;
      await this.dbClient.insertData(sql, [config.model_endpoint, agentId]);
    }

    if (config.model_wrapper != null) {
      let sql = `UPDATE agents SET llm_config = json_set(llm_config, '$.model_wrapper', ?) WHERE id = ?`;
      await this.dbClient.insertData(sql, [config.model_wrapper, agentId]);
    }

    if (config.context_window != null) {
      let sql = `UPDATE agents SET llm_config = json_set(llm_config, '$.context_window', ?) WHERE id = ?`;
      await this.dbClient.insertData(sql, [config.context_window, agentId]);
    }
  }

  async updateAllAgentLLMSettings(config: LLMConfig): Promise<void> {
    if (config.model) {
      let sql = `UPDATE agents SET llm_config = json_set(llm_config, '$.model', ?)`;
      await this.dbClient.insertData(sql, [config.model]);
    } else {
      let sql = `UPDATE agents SET llm_config = json_set(llm_config, '$.model', NULL)`;
      await this.dbClient.insertData(sql, []);
    }

    if (config.model_endpoint_type) {
      let sql = `UPDATE agents SET llm_config = json_set(llm_config, '$.model_endpoint_type', ?)`;
      await this.dbClient.insertData(sql, [config.model_endpoint_type]);
    }

    if (config.model_endpoint) {
      let sql = `UPDATE agents SET llm_config = json_set(llm_config, '$.model_endpoint', ?)`;
      await this.dbClient.insertData(sql, [config.model_endpoint]);
    }

    if (config.model_wrapper) {
      let sql = `UPDATE agents SET llm_config = json_set(llm_config, '$.model_wrapper', ?)`;
      await this.dbClient.insertData(sql, [config.model_wrapper]);
    }

    if (config.context_window) {
      let sql = `UPDATE agents SET llm_config = json_set(llm_config, '$.context_window', ?)`;
      await this.dbClient.insertData(sql, [config.context_window]);
    }
  }

  async updateAgentBaseSystemPrompt(agentId: string, newPrompt: string) {
    let sql = `UPDATE agents SET system = ? WHERE id = ?`;
    await this.dbClient.insertData(sql, [newPrompt, agentId]);

    sql = `UPDATE agents SET state = json_set(state, '$.system', ?) WHERE id = ?`;
    await this.dbClient.insertData(sql, [newPrompt, agentId]);
  }

  async updateAllAgentsBaseSystemPrompt(newPrompt: string) {
    let sql = `UPDATE agents SET system = ?`;
    await this.dbClient.insertData(sql, [newPrompt]);

    sql = `UPDATE agents SET state = json_set(state, '$.system', ?)`;
    await this.dbClient.insertData(sql, [newPrompt]);
  }
}