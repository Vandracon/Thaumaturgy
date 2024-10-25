import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import "./MemGPTAgents.css";
import AgentModal from "./AgentModal";
import AgentCreate from "./AgentCreate"; // Import the create agent modal
import { useNavigate } from "react-router-dom";

interface HumanMemory {
  description: string;
  limit: number;
  value: string;
}

interface AgentMemory {
  description: string;
  limit: number;
  value: string;
}

interface Memory {
  human: HumanMemory;
  persona: AgentMemory;
}

export interface AgentState {
  llm_config: LLMConfig;
  memory: Memory;
}

export interface LLMConfig {
  model: string | null;
  model_endpoint_type: string | null;
  model_endpoint: string | null;
  model_wrapper: string | null;
  context_window: number | null;
}

const MemGPTAgents: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<
    Array<{
      id: string;
      name: string;
      llm_config: LLMConfig;
      state: AgentState | null;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalAgents, setTotalAgents] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState<{
    id: string;
    name: string;
    llm_config: LLMConfig;
    state: AgentState | null;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // State for create modal

  // Fetch agents from the API
  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `/api/v1/agents?page=${currentPage}&pageSize=${itemsPerPage}`,
      );
      setAgents(response.data.agents || []);
      setTotalAgents(response.data.totalCount);
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast.error("Failed to fetch agents.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [currentPage]);

  // Handle agent click to open the AgentModal
  const handleAgentClick = async (agent: {
    id: string;
    name: string;
    llm_config: LLMConfig;
    state: AgentState | null;
  }) => {
    setSelectedAgent(agent);
    setIsModalOpen(true);

    try {
      const response = await axios.get(`/api/v1/agents/${agent.id}`);
      const agentData = { state: response.data };
      setSelectedAgent({ ...agent, ...agentData });
    } catch (error) {
      console.error("Error fetching agent details:", error);
    }
  };

  // Handle page change for pagination
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Handle agent creation and refresh the list
  const handleAgentCreated = (
    id: string,
    name: string,
    llm_config: LLMConfig,
  ) => {
    setIsCreateModalOpen(false); // Close the create modal after creation
    fetchAgents(); // Refresh the list after a new agent is created
    handleAgentClick({ id, name, llm_config, state: null });
  };

  const handleAgentChat = (id: string, agentName: string) => {
    navigate(`/chat/${id}`, { state: { agentName } });
  };

  const totalPages = Math.ceil(totalAgents / itemsPerPage);

  return (
    <div className="agents-container">
      <h1>Agents</h1>
      <button
        className="create-button"
        onClick={() => setIsCreateModalOpen(true)}
      >
        Create
      </button>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <ul className="agent-list">
            <li className="agent-list-header">
              <span className="agent-name-header">Agent Name</span>
              <span className="agent-id-header">ID</span>
            </li>
            {agents?.map((agent) => (
              <li
                key={agent.id}
                className="agent-item"
                onClick={() => handleAgentClick(agent)}
              >
                <span className="agent-name">{agent.name}</span>
                <span className="agent-id">{agent.id}</span>
              </li>
            ))}
          </ul>

          <div className="pagination-controls">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={
                    page === currentPage
                      ? "pagination-btn active"
                      : "pagination-btn"
                  }
                >
                  {page}
                </button>
              ),
            )}
          </div>
          <p className="page-info">
            Page {currentPage} of {totalPages}, Total Agents: {totalAgents}
          </p>
        </div>
      )}

      {/* Modal for editing agent */}
      {selectedAgent && (
        <AgentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          agent={selectedAgent}
          onAgentChat={handleAgentChat}
        />
      )}

      {/* Modal for creating agent */}
      <AgentCreate
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAgentCreated={handleAgentCreated}
      />

      <ToastContainer />
    </div>
  );
};

export default MemGPTAgents;
