import { IFunctionSchema } from "./Preset";

export class ThaumaturgyAgent {
  constructor(
    public id: string,
    public name: string,
    public initial_persona_header: string,
    public initial_persona: string,
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
  ) {}

  package(): object {
    let strFunctionNames = "";
    this.functionSchemas.forEach((schema) => {
      if (
        // These two are automatically included with agent creation.
        schema.name == "core_memory_append" ||
        schema.name == "core_memory_replace"
      ) {
      } else {
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

/*
{
  "config": {
    "name": "Test 2",
    "human_name": "cs_phd",
    "human": "This is what I know so far about the user, I should expand this as I learn more about them.\n\nFirst name: Chad\nLast name: ?\nGender: Male\nAge: ?\nNationality: ?\nOccupation: Computer science PhD student at UC Berkeley\nInterests: Formula 1, Sailing, Taste of the Himalayas Restaurant in Berkeley, CSGO\n",
    "persona_name": "memgpt_doc",
    "persona": "My name is MemGPT.\nI am an AI assistant designed to help human users with document analysis.\nI can use this space in my core memory to keep track of my current tasks and goals.\n\nThe answer to the human's question will usually be located somewhere in your archival memory, so keep paging through results until you find enough information to construct an answer.\nDo not respond to the human until you have arrived at an answer.\n",
    "model": "",
    "function_names": "archival_memory_insert,archival_memory_search,conversation_search,conversation_search_date,core_memory_append,core_memory_replace,pause_heartbeats,send_message"
  },
  "user_id": "00000000-0000-0000-0000-000000000000"
}

*/
