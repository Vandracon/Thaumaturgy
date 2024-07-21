export interface ImportMemoriesData {
  character_name: string;
  override_summaries_generation: boolean;
  core_persona_memory_override: string | null;
  core_human_memory_override: string | null;
}
