import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MemGPTSystemPrompt: React.FC = () => {
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [saveButtonEnabled, setSaveButtonEnabled] = useState<boolean>(true);

  // Fetch system prompt from the server on component mount
  useEffect(() => {
    const fetchSystemPrompt = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/api/v1/mod/agents/system");
        setSystemPrompt(response.data.prompt);
      } catch (error) {
        console.error("Error fetching system prompt:", error);
        toast.error("Failed to load system prompt.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSystemPrompt();
  }, []);

  // Function to handle save action
  const handleSave = async () => {
    try {
      setSaveButtonEnabled(false);
      toast.info("Restarting MemGPT");
      await axios.post("/api/v1/system/memgpt/restart", {});
      toast.info("Saving prompt..");
      await axios.post("/api/v1/mod/agents/system", {
        new_prompt: systemPrompt,
      });
      toast.info("Restarting MemGPT Again");
      await axios.post("/api/v1/system/memgpt/restart", {});
      toast.success("System prompt saved successfully!");
    } catch (error) {
      console.error("Error saving system prompt:", error);
      toast.error("Failed to save system prompt.");
    } finally {
      setSaveButtonEnabled(true);
    }
  };

  // Function to handle changes in the text box
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSystemPrompt(event.target.value);
  };

  return (
    <div className="system-prompt-container">
      <h1>MemGPT System Prompt</h1>
      <p>
        This is the base system prompt used for all agents. Their core memories,
        history, and other data will be appended to this. Refer to LLM logs for
        the whole prompt used.
      </p>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <textarea
            value={systemPrompt}
            onChange={handleChange}
            rows={10}
            className="system-prompt-textarea"
          />
          <p className="character-count">
            Character Count: {systemPrompt.length}
          </p>
          <button
            className="save-button"
            onClick={handleSave}
            disabled={!saveButtonEnabled}
          >
            Save System Prompt
          </button>
        </div>
      )}

      {/* Toast container for showing notifications */}
      <ToastContainer />
    </div>
  );
};

export default MemGPTSystemPrompt;
