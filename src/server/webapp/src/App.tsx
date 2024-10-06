import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
} from "react-router-dom";
import MemGPTSystemPrompt from "./components/MemGPTSystemPrompt";
import "./App.css";
import MemGPTLLMConfig from "./components/MemGPTLLMConfig";
import MemGPTAgents from "./components/MemGPTAgents";
import MemGPTImportMemory from "./components/MemGPTImportMemory";
import AgentChat from "./components/AgentChat";
import ImportCharacters from "./components/ImportCharacters";
import GettingStarted from "./components/GettingStarted";
import Documentation from "./components/Documentation";

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <header>
          <h1>Thaumaturgy</h1>
          <div>(bringing sh*t to life)</div>
        </header>
        <div className="main-layout">
          <nav className="sidebar">
            <ul>
              <li>
                <Link to="/getting-started" className="nav-link">
                  Getting Started
                </Link>
              </li>
              <li>
                <Link to="/docs" className="nav-link">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/agents" className="nav-link">
                  Agents
                </Link>
              </li>
              <li>
                <Link to="/import-memory" className="nav-link">
                  Import Memory
                </Link>
              </li>
              <li>
                <Link to="/import-characters" className="nav-link">
                  Import Characters
                </Link>
              </li>
              <li>
                <Link to="/prompt" className="nav-link">
                  System Prompt
                </Link>
              </li>
              <li>
                <Link to="/llm-config" className="nav-link">
                  LLM Config
                </Link>
              </li>
            </ul>
          </nav>
          <main>
            <Routes>
              <Route path="/getting-started" element={<GettingStarted />} />
              <Route path="/docs" element={<Documentation />} />
              <Route path="/prompt" element={<MemGPTSystemPrompt />} />
              <Route path="/llm-config" element={<MemGPTLLMConfig />} />
              <Route path="/agents" element={<MemGPTAgents />} />
              <Route path="/import-memory" element={<MemGPTImportMemory />} />
              <Route path="/import-characters" element={<ImportCharacters />} />
              <Route path="/" element={<Navigate to="/getting-started" />} />
              <Route path="/chat/:agentId" element={<AgentChat />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
