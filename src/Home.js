import React, { useEffect, useState } from "react";
import "./styles.css";

const Home = () => {
  let llmCount = 0;

  const [status, setStatus] = useState("Queue");
  const [fineTunedLLMs, setFineTunedLLMs] = useState([]);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [savedPrompt, setSavedPrompt] = useState("");

  function addLLM() {
    const llmSelect = document.getElementById("llmSelect");
    const llmName = llmSelect.options[llmSelect.selectedIndex].text;
    const llmValue = llmSelect.value;

    switchLLM(fineTunedLLMs.length);
    // Simulate fine-tuning process
    setStatus("Validated");
    setTimeout(() => {
      setStatus("Running");
      setTimeout(() => {
        setStatus("Successful");
        setFineTunedLLMs((prev) => [...prev, llmName]);
      }, 2000);
    }, 2000);
  }

  function switchLLM(llmId) {
    const tabs = document.querySelectorAll(".llmTab");
    const results = document.querySelectorAll(".llmResult");

    tabs.forEach((tab) => tab.classList.remove("active"));
    results.forEach((result) => result.classList.remove("active"));

    document
      .querySelector(`.llmTab[data-llm-id="${llmId}"]`)
      .classList.add("active");
    document.getElementById(`llmResult-${llmId}`).classList.add("active");
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
              <a href="about.html">PICO</a>
            </li>
            <li>
              <a href="contact.html">About</a>
            </li>
          </ul>
        </nav>
      </header>
      <main>
        <section>
          <h2>Introduction</h2>
          <p>
            You can fine-tuning various LLMs for Y/N task, PICO extraction task
            here easily. It provides Confusion matrix and ROC results for each
            LLMs. So you will find the best LLMs for your task.
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
          <h3>Uploaded Files:</h3>
          <ul>
            {uploadedFiles.map((file, index) => (
              <li key={index}>
                {file}
                <button onClick={() => handleFileDelete(file)}>Delete</button>
              </li>
            ))}
          </ul>
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
          <h2>Fine-tune LLM</h2>
          <form id="llmForm">
            <label htmlFor="llmSelect">Choose LLM:</label>
            <select id="llmSelect" name="llmSelect">
              <option value="gpt-3">GPT-3</option>
              <option value="gpt-4">GPT-4</option>
              <option value="bert">BERT</option>
              <option value="t5">T5</option>
            </select>
            <button type="button" onClick={addLLM}>
              Start Fine-tuning
            </button>
          </form>
          <div className="status-bar">
            <p>Status: {status}</p>
          </div>
          <div className="fine-tuned-llms">
            <h3>Fine-tuned LLMs:</h3>
            <ul>
              {fineTunedLLMs.map((llm, index) => (
                <li key={index}>{llm}</li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <footer>
        <p>&copy; 2023 My Project. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
