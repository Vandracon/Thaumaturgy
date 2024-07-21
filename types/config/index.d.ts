// types/config/index.d.ts

declare module "config" {
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

  interface IMemGPTConfig {
    BASE_URL: string;
    AUTH_TOKEN: string;
    ENDPOINTS: IMemGPTEndpointsConfig;
    FUNCTIONS_SCHEMA: Array<FunctionSchema>;
    CORE_MEMORY_CHARACTER_LIMIT: number;
    MOD: IMemGPTModConfig;
  }

  interface ILLMConfig {
    ENDPOINT: string;
  }

  interface IImporterConfig {
    FILE_PROCESSED_PERSONAS: string;
    FILE_USER_CREATE_RESPONSE: string;
    FILE_CREATE_PRESET_RESPONSE: string;
    FILE_SYSTEM_PROMPT: string;
    MAX_TRIES_BIO_SUMMARY: number;
    MAX_TRIES_MEMORY_IMPORT: number;
  }

  export const MEMGPT: IMemGPTConfig;
  export const LLM: ILLMConfig;
  export const IMPORTER: IImporterConfig;
}
