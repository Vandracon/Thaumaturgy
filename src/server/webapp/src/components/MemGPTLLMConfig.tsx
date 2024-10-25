import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface LLMConfig {
  model_endpoint_type: string | null;
  model_endpoint: string | null;
  model: string | null;
  model_wrapper: string | null;
  context_window: number | null;
}

interface GetLLMConfigResponse {
  config: LLMConfig;
}

const MemGPTLLMConfig: React.FC = () => {
  const [config, setConfig] = useState<LLMConfig>({
    model_endpoint_type: "",
    model_endpoint: "",
    model: "",
    model_wrapper: "",
    context_window: null,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [saveButtonEnabled, setSaveButtonEnabled] = useState<boolean>(true);

  // Fetch the LLM config on component mount
  useEffect(() => {
    const fetchLLMConfig = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get<GetLLMConfigResponse>(
          "/api/v1/mod/agents/llmconfig",
        );
        setConfig(response.data.config);
      } catch (error) {
        console.error("Error fetching LLM config:", error);
        toast.error("Failed to load LLM config.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLLMConfig();
  }, []);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig({ ...config, [name]: value });
  };

  // Handle number input change for context_window
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig({ ...config, [name]: value !== "" ? parseInt(value) : null });
  };

  // Handle save action
  const handleSave = async () => {
    try {
      setSaveButtonEnabled(false);
      toast.info("Restarting MemGPT");
      await axios.post("/api/v1/system/memgpt/restart", {});
      toast.info("Saving config");
      await axios.post("/api/v1/mod/agents/llmconfig", { llm_config: config });
      toast.info("Restarting MemGPT Again");
      await axios.post("/api/v1/system/memgpt/restart", {});
      toast.success("LLM config saved successfully!");
    } catch (error) {
      console.error("Error saving LLM config:", error);
      toast.error("Failed to save LLM config.");
    } finally {
      setSaveButtonEnabled(true);
    }
  };

  return (
    <div className="config-container">
      <h1>Configure the LLM Settings</h1>
      <p>
        Service will restart a couple times for changes to take full effect.
      </p>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="form-container">
          <div className="form-group">
            <label>Model Endpoint Type:</label>
            <span>
              ollama (recommend), koboldcpp, llamacpp, lmstudio,
              lmstudio-legacy, webui-legacy, webui, vllm
            </span>
            <input
              type="text"
              name="model_endpoint_type"
              value={config.model_endpoint_type || ""}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Model Endpoint:</label>
            <input
              type="text"
              name="model_endpoint"
              value={config.model_endpoint || ""}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Model:</label>
            <input
              type="text"
              name="model"
              value={config.model || ""}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Model Wrapper:</label>
            <input
              type="text"
              name="model_wrapper"
              value={config.model_wrapper || ""}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Context Window:</label>
            <input
              type="number"
              name="context_window"
              value={
                config.context_window !== null ? config.context_window : ""
              }
              onChange={handleNumberChange}
            />
          </div>

          <button
            className="save-button"
            onClick={handleSave}
            disabled={!saveButtonEnabled}
          >
            Save Configuration
          </button>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default MemGPTLLMConfig;
