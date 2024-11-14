import { GetAgentDetailsResponse } from "../../Core/Data/MemGPT/GetAgentDetailsResponse";
import { LLMConfig } from "../../Core/Data/MemGPT/Mod/LLMConfig";
import { GetAgentChatHistoryResponse } from "../../Core/Data/MemGPTMod/GetAgentChatHistoryResponse";
import { IDatabaseClient } from "../../Core/Interfaces/IDatabaseClient";
import { Utility } from "../../Core/Utils/Utility";

export interface IMemGPTMod {
  updateAgentLLMSettings(agentId: string, config: LLMConfig): Promise<void>;
  updateAllAgentLLMSettings(
    config: LLMConfig,
    update_agents: boolean,
  ): Promise<void>;
  updateAgentBaseSystemPrompt(
    agentId: string,
    newPrompt: string,
  ): Promise<void>;
  updateAllAgentsBaseSystemPrompt(newPrompt: string): Promise<void>;
  getAgentDetails(id: string): Promise<GetAgentDetailsResponse | null>;
  getChatHistory(
    agentId: string,
    page: number,
    pageSize: number,
  ): Promise<GetAgentChatHistoryResponse>;
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

  async updateAllAgentLLMSettings(
    config: LLMConfig,
    update_agents: boolean,
  ): Promise<void> {
    if (update_agents) {
      if (config.model) {
        let sql = `UPDATE agents SET llm_config = json_set(llm_config, '$.model', ?)`;
        await this.dbClient.insertData(sql, [config.model]);
      } else {
        let sql = `UPDATE agents SET llm_config = json_set(llm_config, '$.model', NULL)`;
        await this.dbClient.insertData(sql, []);
      }
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

    Utility.updateMemGPTLLMConfig(config);
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

    Utility.setSystemPromptSync(newPrompt);
  }

  async getAgentDetails(id: string): Promise<GetAgentDetailsResponse | null> {
    let sql = `SELECT state, llm_config FROM agents WHERE id = ?`;
    let data = await this.dbClient.selectData(sql, [id]);

    if (data && data.length) {
      return data[0];
    }
    return null;
  }

  async getChatHistory(
    agentId: string,
    page: number,
    pageSize: number,
  ): Promise<GetAgentChatHistoryResponse> {
    let entries = await this.dbClient.selectData(
      `SELECT role, text, model, name, tool_calls, created_at FROM memgpt_recall_memory_agent WHERE agent_id = ? AND role != "system" ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [agentId, pageSize, (page - 1) * pageSize],
    );

    let totalCount = 0;
    const result = await this.dbClient.selectData(
      `SELECT COUNT(*) as totalCount FROM memgpt_recall_memory_agent WHERE agent_id = ? AND role != "system"`,
      [agentId],
    );
    if (result && result.length > 0) {
      totalCount = result[0].totalCount;
    }

    return {
      entries,
      totalCount,
    };
  }
}
