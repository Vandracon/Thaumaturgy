import React, { useState } from "react";
import axios from "axios";
import "./AgentCreate.css";
import { ToastContainer, toast } from "react-toastify";

interface AgentCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentCreated: (agentId: string, agentName: string) => void; // Emit both ID and Name
}

const AgentCreate: React.FC<AgentCreateProps> = ({
  isOpen,
  onClose,
  onAgentCreated,
}) => {
  const [name, setName] = useState("");
  const [human, setHuman] = useState("");
  const [model, setModel] = useState("");
  const [functionNames, setFunctionNames] = useState<string[]>([
    "archival_memory_insert",
    "archival_memory_search",
    "conversation_search",
    "conversation_search_date",
    "pause_heartbeats",
    "send_message",
  ]);
  const [persona, setPersona] = useState("");

  const handleFunctionToggle = (func: string) => {
    setFunctionNames((prev) =>
      prev.includes(func) ? prev.filter((f) => f !== func) : [...prev, func],
    );
  };

  const handleSave = async () => {
    const configData = {
      config: {
        name,
        human_name: "basic",
        human,
        persona_name: "memgpt_starter",
        persona,
        model,
        function_names: functionNames.join(","),
        system: null,
      },
    };

    try {
      console.log("Creating agent with data:", configData);
      let res = await axios.post("/api/v1/agents", configData);
      onAgentCreated(res.data.agent_state.id, name);
      toast.success("Agent created");
    } catch (error) {
      console.error("Error creating agent:", error);
    }
  };

  return isOpen ? (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Agent</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>

        <form className="modal-form">
          <div className="form-group">
            <label htmlFor="name">Agent Name</label>
            <p className="field-note">
              Ensure the name is unique. If this agent represents a character in
              a game or simulation, the name must exactly match the name
              provided in the program's prompt to the LLM.
            </p>
            <input
              type="text"
              id="name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter agent name"
            />
          </div>

          {/* <div className="form-group">
            <label htmlFor="persona">Persona</label>
            <p className="field-note">
              Describe the agent's personality or style. It can help guide the
              behavior of your agent.
            </p>
            <input
              type="text"
              id="persona"
              className="form-input"
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              placeholder="Enter persona description"
            />
          </div> */}

          {/* <div className="form-group">
            <label htmlFor="human">Human Description</label>
            <p className="field-note">
              Provide details about the human interaction aspect of the agent,
              such as its role in human-agent conversations.
            </p>
            <input
              type="text"
              id="human"
              className="form-input"
              value={human}
              onChange={(e) => setHuman(e.target.value)}
              placeholder="Enter human description"
            />
          </div> */}

          <div className="form-group">
            <label>Function Names</label>
            <p className="field-note">
              Select the functions that define the agent's capabilities. It’s
              recommended to keep the default options. For example, if
              'send_message' is disabled, the agent won’t be able to communicate
              with you.
            </p>
            {[
              "archival_memory_insert",
              "archival_memory_search",
              "conversation_search",
              "conversation_search_date",
              "pause_heartbeats",
              "send_message",
            ].map((func) => (
              <div key={func}>
                <input
                  type="checkbox"
                  id={func}
                  checked={functionNames.includes(func)}
                  onChange={() => handleFunctionToggle(func)}
                />
                <label htmlFor={func}>{func}</label>
              </div>
            ))}
          </div>

          <div className="modal-buttons">
            <button type="button" className="save-button" onClick={handleSave}>
              Save
            </button>
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>

      <ToastContainer />
    </div>
  ) : null;
};

export default AgentCreate;
