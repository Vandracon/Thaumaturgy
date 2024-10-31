import React from "react";
import "./Documentation.css";

interface DocumentationProps {}

const Documentation: React.FC<DocumentationProps> = () => {
  return (
    <div className="documentation-container">
      <h1 className="documentation-title">Documentation</h1>

      <div className="intent-section">
        <p className="documentation-description">Available Intents:</p>
        <ul className="intent-list">
          <li className="intent-item">
            <strong>1 - One on One</strong>
            <p className="intent-description">
              Used for direct, one-on-one chats with a single agent. You
              exchange messages with the agent directly, with full access to all
              of the agent’s capabilities.
            </p>
          </li>
          <li className="intent-item">
            <strong>2 - Group Conversation</strong>
            <p className="intent-description">
              Activates group conversation mode in Thaumaturgy. Agent bios and
              names are cached and routed to an LLM directly. When the
              conversation ends, each agent is notified and receives an
              individual summary. This process may take some time, depending on
              the number of agents and the length of summaries. During group
              conversations, agents aren’t accessed directly until the end, when
              they are updated on the discussion. Extended capabilities
              (conversation search, archive memory, memory updates, etc.) are
              unavailable until the conversation ends, at which point agents
              decide if any information is relevant for storage.
            </p>
          </li>
          <li className="intent-item">
            <strong>3 - Summarize</strong>
            <p className="intent-description">
              This command indicates that the message is intended for
              summarization. It will generate a summary of the conversation and
              return the result. In group conversations, this will conclude the
              session and update each agent with a summary of the discussion. If
              the group conversation continues, it will resume afterward. This
              helps prevent long conversations from becoming too large to
              process at once.
            </p>
          </li>
        </ul>
      </div>

      <span className="documentation-description">
        Note:
        <ul>
          <li>
            Latest tested LM Studio version: 0.2.31 (newer releases introduced
            breaking changes)
          </li>
          <li>Latest tested KoboldCpp version: 1.75.2</li>
          <li>Using Ollama is recommended for the best experience</li>
        </ul>
      </span>
    </div>
  );
};

export default Documentation;
