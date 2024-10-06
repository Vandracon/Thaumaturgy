import React from "react";
import "./Documentation.css";

interface DocumentationProps {}

const Documentation: React.FC<DocumentationProps> = () => {
  return (
    <div className="documentation-container">
      <h1 className="documentation-title">Documentation</h1>
      <span className="documentation-description">
        Available Intents: 1 = One on One, 2 = Group Conversation, 3 = Summarize
      </span>
      <span className="documentation-description">
        Helpful Info:
        <ul>
          <li>Latest Tested LM Studio Version 0.2.31</li>
          <li>Latest Tested KoboldCpp Version 1.75.2</li>
        </ul>
      </span>
    </div>
  );
};

export default Documentation;
