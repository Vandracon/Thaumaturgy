import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ImportCharacters.css";

interface ImportCharactersConfig {
  import_type: string;
  agent_persona_starter: string;
  use_previously_processed_bios_file: boolean;
  use_previously_imported_personas: boolean;
  create_user_template: boolean;
  domain: string;
  player_starter_memory: string;
  file: File | null;
}

const ImportCharacters: React.FC = () => {
  const [config, setConfig] = useState<ImportCharactersConfig>({
    import_type: "mantella",
    agent_persona_starter: "A character in skyrim.",
    use_previously_processed_bios_file: false,
    use_previously_imported_personas: false,
    create_user_template: false,
    domain: "Skyrim",
    player_starter_memory: "An adventurer in Skyrim.",
    file: null,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [statusText, setStatusText] = useState("Waiting for status...");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig((prevConfig) => ({
      ...prevConfig,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setConfig((prevConfig) => ({
      ...prevConfig,
      file,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("import_type", config.import_type);
    formData.append("agent_persona_starter", config.agent_persona_starter);
    formData.append(
      "use_previously_processed_bios_file",
      String(config.use_previously_processed_bios_file),
    );
    formData.append(
      "use_previously_imported_personas",
      String(config.use_previously_imported_personas),
    );
    formData.append(
      "create_user_template",
      String(config.create_user_template),
    );
    formData.append("domain", config.domain);
    formData.append("player_starter_memory", config.player_starter_memory);

    if (config.file) {
      formData.append("file", config.file);
    }

    try {
      const response = await axios.post("/api/v1/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("File uploaded successfully! Tracking progress...");
      setModalOpen(true);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file.");
    }
  };

  // Poll status periodically
  useEffect(() => {
    if (modalOpen) {
      const interval = setInterval(async () => {
        try {
          const statusResponse = await axios.get(`/api/v1/import/status`);
          const status = statusResponse.data.data as string;

          setStatusText(`Status: \n\n${status}`);

          if (status.indexOf("STATUS_END") !== -1) {
            clearInterval(interval);
            setModalOpen(false);
            toast.success("Task completed!");
          }
        } catch (error) {
          console.error("Error fetching task status:", error);
          setStatusText("Error fetching status.");
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval); // Cleanup on unmount
    }
  }, [modalOpen]);

  return (
    <div className="config-container">
      <h1>Bulk Import</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>File:</label>
          <input type="file" name="file" onChange={handleFileChange} />
        </div>

        <div>
          <label>Import Type:</label>
          <input
            type="text"
            name="import_type"
            value={config.import_type}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label>Agent Persona Starter:</label>
          <input
            type="text"
            name="agent_persona_starter"
            value={config.agent_persona_starter}
            onChange={handleInputChange}
          />
        </div>

        {/* <div className="checkbox-group">
          <label>Use Previously Processed Bios File:</label>
          <input
            type="checkbox"
            name="use_previously_processed_bios_file"
            checked={config.use_previously_processed_bios_file}
            onChange={handleInputChange}
          />
        </div> */}

        {/* <div className="checkbox-group">
          <label>Use Previously Imported Personas:</label>
          <input
            type="checkbox"
            name="use_previously_imported_personas"
            checked={config.use_previously_imported_personas}
            onChange={handleInputChange}
          />
        </div> */}

        {/* <div className="checkbox-group">
          <label>Create User Template:</label>
          <input
            type="checkbox"
            name="create_user_template"
            checked={config.create_user_template}
            onChange={handleInputChange}
          />
        </div> */}

        <div>
          <label>Domain:</label>
          <input
            type="text"
            name="domain"
            value={config.domain}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label>Player Starter Memory:</label>
          <input
            type="text"
            name="player_starter_memory"
            value={config.player_starter_memory}
            onChange={handleInputChange}
          />
        </div>

        <button type="submit">Submit</button>
      </form>
      <p>
        This process may take some time, depending on the number of characters.
        If their bios exceed the core memory persona limit, they will be
        summarized again to fit within the limit. You can check the Thaumaturgy
        console for status.
      </p>

      <ToastContainer />

      {/* Modal for displaying status */}
      {modalOpen && (
        <div className="progress-modal">
          <div className="progress-modal-content">
            <h2>Import Progress</h2>
            <p>{statusText}</p>
            <p>
              It is best to leave the system alone until it completes. Keep the
              LLM free for the import process. This may take a while to
              complete.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportCharacters;
