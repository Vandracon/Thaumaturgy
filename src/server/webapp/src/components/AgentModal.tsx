import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "react-modal";
import { ToastContainer, toast } from "react-toastify";
import "./AgentModal.css";
import { LLMConfig } from "./MemGPTAgents";

interface AgentMemory {
  description: string;
  limit: number;
  value: string;
}

interface Memory {
  persona: AgentMemory;
  human: AgentMemory;
}

interface AgentState {
  llm_config: LLMConfig;
  memory: Memory;
}

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: {
    id: string;
    name: string;
    llm_config: LLMConfig;
    state: AgentState | null;
  } | null;
  onAgentChat: (id: string, agentName: string) => void;
}

const AgentModal: React.FC<AgentModalProps> = ({
  isOpen,
  onClose,
  agent,
  onAgentChat,
}) => {
  const [model, setModel] = useState<string>("");
  const [personaMemory, setPersonaMemory] = useState<string>("");
  const [humanMemory, setHumanMemory] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize memory state from agent when modal opens
  useEffect(() => {
    if (agent) {
      setModel(agent.llm_config.model || "");
      setPersonaMemory(agent.state?.memory.persona.value || "");
      setHumanMemory(agent.state?.memory.human.value || "");
    }
  }, [agent]);

  if (!agent) return null;

  // Function to handle saving updated memory
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.patch(`/api/v1/agents/${agent.id}/memory`, {
        persona: personaMemory,
        human: humanMemory,
        model,
      });
      toast.success("Saved");
    } catch (error) {
      console.error("Error updating agent memory:", error);
      toast.error("Failed to update agent memory");
    } finally {
      setIsSaving(false);
    }
  };

  // Function to handle the change in persona value
  const handlePersonaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPersonaMemory(e.target.value);
  };

  // Function to handle the change in human memory value
  const handleHumanMemoryChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setHumanMemory(e.target.value);
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="modal-content"
      overlayClassName="modal-overlay"
    >
      <div className="modal-header">
        <h2>
          {agent.name}
          <button
            className="chat-button"
            onClick={() => onAgentChat(agent.id, agent.name)}
          >
            Chat
          </button>
        </h2>

        <button className="close-button" onClick={onClose}>
          &times;
        </button>
      </div>
      <form className="modal-form">
        <div className="form-group">
          <label htmlFor="agent-id">ID:</label>
          <span>{agent.id}</span>
        </div>
        <div className="form-group">
          <label htmlFor="agent-name">Name:</label>
          <span>{agent.name}</span>
        </div>
        <div className="form-group">
          <label htmlFor="agent-name">AI Model:</label>
          <input
            type="text"
            placeholder="Enter valid model name"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="agent-persona">Agent Persona:</label>
          <textarea
            id="agent-persona"
            value={personaMemory}
            className="form-input"
            rows={13}
            maxLength={agent.state?.memory.persona.limit}
            onChange={handlePersonaChange}
          />
          <span className="char-limit">
            Characters ({personaMemory.length}/
            {agent.state?.memory.persona.limit})
          </span>
        </div>

        <div className="form-group">
          <label htmlFor="agent-human-memory">Human Memory:</label>
          <textarea
            id="agent-human-memory"
            value={humanMemory}
            className="form-input"
            rows={8}
            maxLength={agent.state?.memory.human.limit}
            onChange={handleHumanMemoryChange}
          />
          <span className="char-limit">
            Characters ({humanMemory.length}/{agent.state?.memory.human.limit})
          </span>
        </div>

        <div className="modal-buttons">
          <button
            type="button"
            onClick={handleSave}
            className="save-button"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={onClose} className="cancel-button">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AgentModal;
