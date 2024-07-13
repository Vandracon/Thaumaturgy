export interface IFunctionSchema {
  name: string;
}

export class Preset {
  constructor(
    public name: string,
    public systemName: string,
    public human: string,
    public humanName: string,
    public functionsSchema: Array<IFunctionSchema>,
  ) {}

  public serialize(): string {
    return JSON.stringify({
      name: this.name,
      system_name: this.systemName,
      human: this.human,
      human_name: this.humanName,
      functions_schema: this.functionsSchema,
    });
  }
}

/*
{
    name: presetName,
    system_name: presetName,
    human: userTemplate,
    human_name: userTemplateName,
    functions_schema: [
      { name: "archival_memory_insert" },
      { name: "archival_memory_search" },
      { name: "conversation_search" },
      { name: "conversation_search_date" },
      { name: "core_memory_append" },
      { name: "core_memory_replace" },
      { name: "pause_heartbeats" },
      { name: "send_message" },
    ],
  }
    */
