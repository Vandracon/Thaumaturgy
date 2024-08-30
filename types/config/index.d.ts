// types/config/index.d.ts

declare module "config" {
  interface IThaumaturgyConfig {
    DOMAIN: string;
    HUMAN_STARTER_MEMORY: string;
    UNKNOWN_AGENT_CREATION_PERSONA: string;
  }

  interface IMemGPTEndpointsConfig {
    AUTH: string;
    PERSONAS: string;
    AGENTS: string;
    HUMANS: string;
    PRESETS: string;
  }

  interface FunctionSchema {
    name: string;
  }

  interface IMemGPTModConfig {
    MEMGPT_SQLITE_DATABASE_PATH: string;
  }

  interface IMemGPTGroupChatConfig {
    DEFAULT_SYSTEM_PROMPT: string;
  }

  interface IMemGPTConfig {
    BASE_URL: string;
    AUTH_TOKEN: string;
    ENDPOINTS: IMemGPTEndpointsConfig;
    FUNCTIONS_SCHEMA: Array<FunctionSchema>;
    CORE_MEMORY_CHARACTER_LIMIT: number;
    DYNAMIC_RESPONSE_TIME_SCALE: number;
    ADDITIONAL_DYNAMIC_RESPONSE_TIMEOUT_IN_MS: number;
    ADDITIONAL_DYNAMIC_RESPONSE_TIMEOUT_FOR_FIRST_MESSAGE_IN_MS: number;
    MOD: IMemGPTModConfig;
    GROUP_CHAT: IMemGPTGroupChatConfig;
  }

  interface ILLMConfig {
    ENDPOINT: string;
    FALLBACK_MAX_TOKENS: number;
  }

  interface IImporterConfig {
    FILE_PROCESSED_PERSONAS: string;
    FILE_USER_CREATE_RESPONSE: string;
    FILE_CREATE_PRESET_RESPONSE: string;
    FILE_SYSTEM_PROMPT: string;
    MAX_TRIES_BIO_SUMMARY: number;
    MAX_TRIES_MEMORY_IMPORT: number;
  }

  interface IMiscConfig {
    MANTELLA: IMiscMantellaConfig;
  }

  interface IMiscMantellaConfig {
    CHARACTERS_CSV_PATH: string;
  }

  export const THAUMATURGY: IThaumaturgyConfig;
  export const MEMGPT: IMemGPTConfig;
  export const LLM: ILLMConfig;
  export const IMPORTER: IImporterConfig;
  export const MISC: IMiscConfig;
}
