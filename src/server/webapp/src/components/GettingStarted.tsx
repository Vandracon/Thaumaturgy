import React from "react";
import "./GettingStarted.css";

interface GettingStartedProps {}

const GettingStarted: React.FC<GettingStartedProps> = () => {
  return (
    <div className="getting-started-container">
      <h1 className="getting-started-title">Getting Started</h1>
      <span className="getting-started-description">
        Step One:
        <br />
        <br />
        To begin, go to <a href="/llm-config">LLM Config</a> and setup the LLM
        that you will be using. Once it is set, you should restart the server
        for MemGPT to save the changes. If you chatted with any agents, restart
        this service first so any loaded agents wont re-save their old config on
        shutdown.
      </span>
      <hr />
      <br />
      <span className="getting-started-description">
        Step Two:
        <br />
        <br />
        If you’re planning to import characters, it’s best to do this now. Since
        the import process can take some time (depending on the number of
        characters), creating a backup of the imported data allows you to reuse
        it across different environments, game saves, and users without having
        to run import again.
      </span>
      <p className="getting-started-description">
        The <b>csv</b> file should contain at least the following columns:
        <ul>
          <li>
            <b>race</b>
          </li>
          <li>
            <b>gender</b>
          </li>
          <li>
            <b>species</b>
          </li>
          <li>
            <b>bio</b>
          </li>
        </ul>
        Go to the{" "}
        <a href="/import-characters" className="link-highlight">
          Import Characters
        </a>{" "}
        page to get started.
      </p>
      <hr />
      <br />
      <span className="getting-started-description">
        Step Three:
        <br />
        <br />
        For the service you're using to talk to Thaumaturgy, edit the prompts
        sent using the following format. "intent|=|npc_name|=|original_prompt".
        <br />
        <br />
        For example, if your prompt for a 1 on 1 conversation is:
        <br />
        <br />
        "Player may respond with asterisks *player picked up mushroom*. Npc Bio:
        Life's been a wild ride since that fire. The Khajiit who saved me,
        they're my unsung heroes."
        <br />
        <br />
        You would instead change it to "1|=|Abiona|=|Player may respond with
        asterisks *player picked up mushroom*. Npc Bio: Life's been a wild ride
        since that fire. The Khajiit who saved me, they're my unsung heroes."
        <br />
        <br />
        This tells Thaumaturgy that you're having a 1 on 1 conversation with a
        character named Abelone and the last part is the fallback prompt. The
        fallback prompt is used if something goes wrong and the request will
        instead go straight to LLM just like it normally would. Also note that
        if you don't use the format ("intent|=|npc_name|=|original_prompt") then
        all requests go to the LLM and return back to you as normal. Essentially
        making Thaumaturgy a proxy service to a traditional LLM (like lmstudio,
        kobold, open ai, openrouter etc).
      </span>
      <br />
      <hr />
      <br />
      <span className="getting-started-description">
        Available Intents: 1 = One on One, 2 = Group Conversation, 3 = Summarize
      </span>
    </div>
  );
};

export default GettingStarted;
