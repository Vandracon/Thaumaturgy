import { IFunctionSchema } from "./Preset";

export class ThaumaturgyAgent {
  constructor(
    public id: string,
    public name: string,
    public persona: string,
  ) {}
}

export class Agent {
  constructor(
    public name: string,
    public humanName: string,
    public human: string,
    public personaName: string,
    public persona: string,
    public model: string,
    public functionSchemas: Array<IFunctionSchema>,
    public preset: string,
  ) {}

  package(): object {
    let strFunctionNames = "";
    this.functionSchemas.forEach((schema) => {
      if (
        schema.name == "core_memory_append" ||
        schema.name == "core_memory_replace"
      ) {
      } // todo: figure out right usage of this
      else {
        strFunctionNames += `${schema.name},`;
      }
    });
    strFunctionNames = strFunctionNames.substring(
      0,
      strFunctionNames.length - 1,
    );

    return {
      name: this.name,
      human_name: this.humanName,
      human: this.human,
      persona_name: this.personaName,
      persona: this.persona,
      model: "",
      function_names: strFunctionNames,
      preset: this.preset,
    };
  }
}

/*
var agentFunctionNames =
  "archival_memory_insert,archival_memory_search,conversation_search,conversation_search_date,pause_heartbeats,send_message";

  name: data.persona.name,
  human_name: userTemplateName,
  human: userTemplate,
  persona_name: data.persona.name,
  persona: data.persona.text,
  model: null,
  function_names: agentFunctionNames,
  preset: presetName,
*/
