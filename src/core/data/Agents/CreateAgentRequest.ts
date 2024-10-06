export interface CreateAgentRequest {
  config: CreateAgentRequestConfig;
}

export interface CreateAgentRequestConfig {
  name: string;
  human_name: string;
  human: string;
  persona_name: string;
  persona: string;
  model: string;
  function_names: string;
  system: null;
}
