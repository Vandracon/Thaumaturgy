export interface MemGPTChatResponse {
  /*    Example
    {
      "messages": [
          {
              "internal_monologue": "Player wants me to follow them into a room. I should proceed cautiously.",
              "date": "2024-07-05T03:58:23.065940+00:00",
              "id": "9c92d9a5-4422-4abf-a7cb-d1466f739e4d"
          },
          {
              "function_call": {
                  "name": "send_message",
                  "arguments": "{\"message\": \"Lead the way, and I'll accompany you.\"}"
              },
              "id": "9c92d9a5-4422-4abf-a7cb-d1466f739e4d",
              "date": "2024-07-05T03:58:23.065940+00:00"
          },
          {
              "function_return": "None",
              "status": "success",
              "id": "ce0f40a4-89e7-4291-8803-7418b6d5e5b5",
              "date": "2024-07-05T03:58:23.065940+00:00"
          }
      ],
      "usage": {
          "completion_tokens": 55,
          "prompt_tokens": 5822,
          "total_tokens": 5872,
          "step_count": 1
      }
  }
*/
  messages: Array<MonologueMessage | FunctionCallMessage | FunctionReturn>;
  usage: Usage;
}

export interface MonologueMessage {
  internal_monologue: string;
  date: string;
  id: string;
}

export interface FunctionCallMessage {
  function_call: FunctionCall;
  id: string;
  date: string;
}

export interface FunctionCall {
  name: string;
  arguments: string;
}

export interface FunctionReturn {
  function_return: string;
  status: string;
  id: string;
  date: string;
}

export interface Usage {
  completion_tokens: number;
  prompt_tokens: number;
  total_tokens: number;
  step_count: number;
}
