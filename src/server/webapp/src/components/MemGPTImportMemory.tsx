import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./MemGPTImportMemory.css";

const MemGPTImportMemory: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [characterName, setCharacterName] = useState<string>("");
  const [corePersonaMemoryOverride, setCorePersonaMemoryOverride] =
    useState<string>("");
  const [coreHumanMemoryOverride, setCoreHumanMemoryOverride] =
    useState<string>("");
  const [overrideSummariesGeneration, setOverrideSummariesGeneration] =
    useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (
      (!file && !overrideSummariesGeneration) ||
      !characterName ||
      (overrideSummariesGeneration &&
        (!corePersonaMemoryOverride || !coreHumanMemoryOverride))
    ) {
      toast.info("Please fill in all fields and upload a file.");
      return;
    }

    const formData = new FormData();
    if (file) formData.append("file", file);
    formData.append("character_name", characterName);
    formData.append("core_persona_memory_override", corePersonaMemoryOverride);
    formData.append("core_human_memory_override", coreHumanMemoryOverride);
    formData.append(
      "override_summaries_generation",
      overrideSummariesGeneration.toString(),
    );

    setIsSubmitting(true);
    try {
      // for (let [key, value] of formData.entries()) {
      //   console.log(key, value);
      // }
      await axios.post(`/api/v1/memory/import`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Memories imported");
      clearForm();
    } catch (error) {
      console.error("Error submitting data:", error);
      toast.error("Failed to import");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form clear
  const clearForm = () => {
    setFile(null);
    setCharacterName("");
    setCorePersonaMemoryOverride("");
    setCoreHumanMemoryOverride("");
    setOverrideSummariesGeneration(false);
  };

  return (
    <div>
      <h1>Import Memory</h1>
      <form>
        <div className="form-group">
          <label htmlFor="file">File:</label>
          <div className="field-instruct">
            Attach a file that contains summary data for the character
          </div>
          <input type="file" id="file" onChange={handleFileChange} />
        </div>
        <div className="form-group">
          <label htmlFor="character_name">Character Name:</label>
          <div className="field-instruct">The name must match EXACTLY</div>
          <input
            type="text"
            id="character_name"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
          />
        </div>
        <div className="field-instruct">
          This section lets you override LLM-based summaries for agent persona
          and human memory, using your provided input instead
        </div>
        <div className="override-summaries-container">
          <div className="form-group">
            <label htmlFor="override_summaries_generation">
              Override Summaries Generation:
            </label>
            <input
              type="checkbox"
              id="override_summaries_generation"
              checked={overrideSummariesGeneration}
              onChange={(e) => setOverrideSummariesGeneration(e.target.checked)}
            />
          </div>

          {/* Conditionally render the override fields */}
          {overrideSummariesGeneration && (
            <>
              <div className="form-group">
                <label htmlFor="core_persona_memory_override">
                  Core Persona Memory Override:
                </label>
                <textarea
                  id="core_persona_memory_override"
                  value={corePersonaMemoryOverride}
                  onChange={(e) => setCorePersonaMemoryOverride(e.target.value)}
                  rows={4}
                />
              </div>
              <br />
              <div className="form-group">
                <label htmlFor="core_human_memory_override">
                  Core Human Memory Override:
                </label>
                <textarea
                  id="core_human_memory_override"
                  value={coreHumanMemoryOverride}
                  onChange={(e) => setCoreHumanMemoryOverride(e.target.value)}
                  rows={4}
                />
              </div>
              <br />
            </>
          )}
        </div>

        <br />
        <button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
        <button type="button" onClick={clearForm}>
          Clear
        </button>
      </form>

      <ToastContainer />
    </div>
  );
};

export default MemGPTImportMemory;
