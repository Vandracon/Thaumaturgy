export interface CoreMemory {
  human: string;
  persona: string;
}

export interface CoreMemoryResponse {
  core_memory: CoreMemory;
  recall_memory: number;
  archival_memory: number;
}
