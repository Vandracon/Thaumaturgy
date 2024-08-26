export enum ThaumicIntent {
  ONE_ON_ONE = 1,
  GROUP_CONVERSATION = 2,
  SUMMARIZE = 3,
}

export interface IThaumicRequest {
  is_thaumic: boolean;
  intent: ThaumicIntent;
  uids: Array<string>;
  thaumicSystemPrompt: string;
  fallback_prompt: string;
}
