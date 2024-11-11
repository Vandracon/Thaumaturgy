import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "./Filtering.css";

const Filtering: React.FC = () => {
  const [filters, setFilters] = useState([{ find: "", replace: "" }]);

  // Fetch existing filters from the API on mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await axios.get("/api/v1/filtering");
        if (response.data && response.data.data && response.data.data.filters) {
          setFilters(response.data.data.filters);
        }
      } catch (error) {
        console.error("Error loading filters:", error);
        toast.error("Error loading filters");
      }
    };

    fetchFilters();
  }, []);

  const handleAddRow = () => {
    setFilters([...filters, { find: "", replace: "" }]);
  };

  const handleInputChange = (
    index: number,
    field: "find" | "replace",
    value: string,
  ) => {
    const newFilters = [...filters];
    newFilters[index][field] = value;
    setFilters(newFilters);
  };

  const handleDeleteRow = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters);
  };

  const handleSubmit = async () => {
    try {
      console.log(filters);
      await axios.post("/api/v1/filtering", { data: filters });
      toast.success("Filters submitted successfully");
    } catch (error) {
      toast.error("Error submitting filters");
    }
  };

  return (
    <div className="filtering-container">
      <h1>Filtering</h1>
      <p>
        Filters are used to capture incoming user message text on the
        OpenAI-compatible endpoint. This allows you to find and replace specific
        text if needed. One example is if you're using a service that posts a
        lot of reminders or other repetitive data that overly influences agent
        behavior. You might prefer the reminders go into the system prompt once
        rather than with every user message, to avoid being too overpowering.
      </p>
      <div className="filtering-rows">
        {filters.map((filter, index) => (
          <div key={index} className="filter-row">
            <input
              type="text"
              placeholder="Find (Regex Compatible)"
              value={filter.find}
              onChange={(e) => handleInputChange(index, "find", e.target.value)}
              className="filter-input"
            />
            <input
              type="text"
              placeholder="Replace"
              value={filter.replace}
              onChange={(e) =>
                handleInputChange(index, "replace", e.target.value)
              }
              className="filter-input"
            />
            <button
              onClick={() => handleDeleteRow(index)}
              className="delete-row-button"
            >
              X
            </button>
          </div>
        ))}
      </div>
      <button onClick={handleAddRow} className="add-row-button">
        Add Filter
      </button>
      <button onClick={handleSubmit} className="submit-button">
        Submit
      </button>

      <ToastContainer />
    </div>
  );
};

export default Filtering;
