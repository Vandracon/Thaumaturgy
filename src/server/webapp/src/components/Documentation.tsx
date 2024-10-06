import React from "react";
import "./Documentation.css";

interface DocumentationProps {}

const Documentation: React.FC<DocumentationProps> = () => {
  return (
    <div className="documentation-container">
      <h1 className="documentation-title">Documentation</h1>
      <p className="documentation-description">
        Available Intents: 1 = One on One, 2 = Group Conversation, 3 = Summarize
      </p>
      <span className="documentation-description">
        Helpful Info:
        <li>
          Latest Tested LM Studio Version 0.2.31 (newer releases made a breaking
          change)
        </li>
        <li>Latest Tested KoboldCpp Version 1.75.2</li>
      </span>
    </div>
  );
};

export default Documentation;
