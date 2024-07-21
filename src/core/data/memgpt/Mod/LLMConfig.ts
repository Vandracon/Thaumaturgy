export interface LLMConfig {
  model: string | null;
  model_endpoint_type: string | null;
  model_endpoint: string | null;
  model_wrapper: string | null;
  context_window: number | null;
}
