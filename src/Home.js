import React, { useEffect, useState } from "react";
import "./styles.css";
import llms from "./llms";

const Home = () => {
  const [status, setStatus] = useState("");
  const [fineTunedLLMs, setFineTunedLLMs] = useState([]);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [savedPrompt, setSavedPrompt] = useState("");
  const [trainFile, setTrainFile] = useState("");
  const [valFile, setValFile] = useState("");

  function addLLM() {
    const llmSelect = document.getElementById("llmSelect");
    const llmName = llmSelect.options[llmSelect.selectedIndex].text;

    // Trigger the creation of fine-tuning data
    createFineTuningData(llmName).then((data) => {
      if (data && data.trainFile && data.valFile) {
        setTrainFile(data.trainFile);
        setValFile(data.valFile);
        setStatus("Fine-tuning Data Ready");
      } else {
        setStatus("Failed to create fine-tuning data.");
      }
    });
  }

  async function createFineTuningData(llmName) {
    const csvFile = uploadedFiles[0]; // Assuming the first uploaded file is the CSV file
    try {
      const response = await fetch(
        "http://localhost:3001/create-fine-tuning-data",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: savedPrompt, csvFile }),
        }
      );
      const data = await response.json();
      console.log(data.message);
      return { trainFile: data.trainFile, valFile: data.valFile };
    } catch (error) {
      console.error("Error:", error);
    }
  }

  function submitPrompt() {
    const promptInput = document.getElementById("promptInput").value;
    fetch("http://localhost:3001/save-prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: promptInput }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data.message);
        setSavedPrompt(promptInput); // Update the saved prompt
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  function handleFileUpload(event) {
    event.preventDefault();
    const formData = new FormData();
    const fileField = document.getElementById("csvFile");

    formData.append("csvFile", fileField.files[0]);

    fetch("http://localhost:3001/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          setUploadMessage(data.message);
        } else {
          setUploadMessage("File uploaded successfully.");
        }
        if (data.file) {
          setUploadedFiles((prev) => [...prev, data.file]);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        setUploadMessage("File upload failed.");
      });
  }

  function handleFileDelete(filename) {
    fetch(`http://localhost:3001/delete/${filename}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        setUploadMessage(data.message);
        if (data.message === "File deleted!") {
          setUploadedFiles((prev) => prev.filter((file) => file !== filename));
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        setUploadMessage("File deletion failed.");
      });
  }

  return (
    <div>
      <header>
        <h1>Fine-tuning LLMs Helper</h1>
        <nav>
          <ul>
            <li>
              <a href="index.html">Y/N</a>
            </li>
            <li>
              <a href="pico.html">PICO</a>
            </li>
            <li>
              <a href="about.html">About</a>
            </li>
          </ul>
        </nav>
      </header>
      <main>
        <section>
          <h2>Introduction</h2>
          <p>
            You can fine-tune various LLMs for Y/N task, PICO extraction task
            here easily. It provides Confusion matrix and ROC results for each
            LLM. So you will find the best LLM for your task.
          </p>
        </section>
        <section>
          <h2>Upload fine-tuning data</h2>
          <p>
            Your CSV file should include columns that provide the input data
            (e.g., 'Title', 'Abstract', 'Keywords') and a 'Decision' column with
            the expected output. You can use any relevant columns for input, as
            long as the 'Decision' column reflects the judgment or prediction
            you want the model to make.
          </p>
          <form onSubmit={handleFileUpload} encType="multipart/form-data">
            <label htmlFor="csvFile">Choose CSV file:</label>
            <input type="file" id="csvFile" name="csvFile" accept=".csv" />
            <button type="submit">Upload</button>
          </form>
          {uploadMessage && <p>{uploadMessage}</p>}
          <div className="uploaded-files">
            <h3>Uploaded Files:</h3>
            <ul>
              {uploadedFiles.map((file, index) => (
                <li key={index}>
                  {file}
                  <button onClick={() => handleFileDelete(file)}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section>
          <h2>Input Prompt</h2>
          <div className="prompt-container">
            <form id="promptForm">
              <label htmlFor="promptInput">Enter your prompt:</label>
              <textarea
                id="promptInput"
                name="promptInput"
                rows="4"
                cols="50"
              ></textarea>
              <button type="button" onClick={submitPrompt}>
                Submit Prompt
              </button>
            </form>
            <div id="promptExample">
              <h3>Example Prompt:</h3>
              <p>
                "You are an advanced research assistant. Your task is to analyze
                Title, Abstract, and Keywords of each article to decide whether
                the article should be included or excluded."
              </p>
            </div>
            {savedPrompt && (
              <div id="savedPrompt">
                <h3>Your Prompt:</h3>
                <p>{savedPrompt}</p>
              </div>
            )}
          </div>
        </section>
        <section>
          <h2>Prepare Fine-tune Data & Validate Data</h2>
          <form id="llmForm">
            <label htmlFor="llmSelect">Choose LLM:</label>
            <select id="llmSelect" name="llmSelect">
              {llms.map((llm) => (
                <option key={llm.value} value={llm.value}>
                  {llm.label}
                </option>
              ))}
            </select>
            <button type="button" onClick={addLLM}>
              Prepare Data
            </button>
          </form>
          <div className="status-bar">
            <p>Status: {status}</p>
          </div>
          {status === "Fine-tuning Data Ready" && (
            <div className="fine-tuned-llms">
              <h3>Fine-tuned LLMs:</h3>
              <ul>
                {fineTunedLLMs.map((llm, index) => (
                  <li key={index}>{llm}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
      <footer>
        <p>&copy; 2023 My Project. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
