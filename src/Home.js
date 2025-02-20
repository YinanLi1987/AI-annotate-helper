import React, { useEffect } from "react";
import "./styles.css";

const Home = () => {
  let llmCount = 0;
  let currentPage = 1;
  let rowsPerPage = 20;

  function addLLM() {
    const llmSelect = document.getElementById("llmSelect");
    const llmName = llmSelect.options[llmSelect.selectedIndex].text;
    const llmValue = llmSelect.value;

    const llmTabs = document.getElementById("llmTabs");
    const llmResults = document.getElementById("llmResults");
    const resultsTable = document
      .getElementById("resultsTable")
      .querySelector("thead tr");

    // Add new tab
    const tab = document.createElement("div");
    tab.className = "llmTab";
    tab.innerText = llmName;
    tab.dataset.llmId = llmCount;
    tab.onclick = () => switchLLM(llmCount);
    llmTabs.appendChild(tab);

    // Add new result section
    const result = document.createElement("div");
    result.className = "llmResult";
    result.id = `llmResult-${llmCount}`;
    result.innerHTML = `<h3>${llmName} Results</h3><p>No results yet.</p>`;
    llmResults.appendChild(result);

    // Add new column to the results table
    const th = document.createElement("th");
    th.innerText = llmName;
    resultsTable.appendChild(th);

    switchLLM(llmCount);
    llmCount++;
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

  function toggleDecision(cell) {
    cell.innerText = cell.innerText === "Include" ? "Exclude" : "Include";
    updateRowColor(cell.parentElement);
  }

  function updateRowColor(row) {
    const decisions = Array.from(row.querySelectorAll("td"))
      .slice(1)
      .map((td) => td.innerText);
    const allSame = decisions.every((decision) => decision === decisions[0]);

    if (allSame) {
      row.classList.remove("inconsistent");
      row.classList.add("consistent");
    } else {
      row.classList.remove("consistent");
      row.classList.add("inconsistent");
    }
  }

  function toggleInconsistentRows() {
    const showInconsistentOnly =
      document.getElementById("toggleInconsistent").checked;
    const rows = document.querySelectorAll("#resultsTable tbody tr");

    rows.forEach((row) => {
      if (showInconsistentOnly && !row.classList.contains("inconsistent")) {
        row.classList.add("hidden");
      } else {
        row.classList.remove("hidden");
      }
    });
  }

  function exportToJson() {
    const rows = document.querySelectorAll("#resultsTable tbody tr");
    const data = [];

    rows.forEach((row) => {
      const articleTitle = row.querySelector("td").innerText;
      const decisions = Array.from(row.querySelectorAll("td"))
        .slice(1)
        .map((td) => td.innerText);
      data.push({ articleTitle, decisions });
    });

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "annotated_results.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function changeRowsPerPage() {
    rowsPerPage = parseInt(document.getElementById("rowsPerPage").value);
    currentPage = 1;
    displayTableRows();
  }

  function previousPage() {
    if (currentPage > 1) {
      currentPage--;
      displayTableRows();
    }
  }

  function nextPage() {
    const totalRows = document.querySelectorAll(
      "#resultsTable tbody tr"
    ).length;
    if (currentPage * rowsPerPage < totalRows) {
      currentPage++;
      displayTableRows();
    }
  }

  function displayTableRows() {
    const rows = document.querySelectorAll("#resultsTable tbody tr");
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    rows.forEach((row, index) => {
      if (index >= start && index < end) {
        row.classList.remove("hidden");
      } else {
        row.classList.add("hidden");
      }
    });

    updatePageNumbers();
  }

  function updatePageNumbers() {
    const totalRows = document.querySelectorAll(
      "#resultsTable tbody tr"
    ).length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    const pageNumbers = document.getElementById("pageNumbers");
    pageNumbers.innerHTML = `Page ${currentPage} of ${totalPages}`;
  }

  function submitPrompt() {
    const promptInput = document.getElementById("promptInput").value;
    console.log("Prompt submitted:", promptInput);
  }

  useEffect(() => {
    // Initial update for existing rows
    document.querySelectorAll("#resultsTable tbody tr").forEach(updateRowColor);
    displayTableRows();
  }, []);

  return (
    <div>
      <header>
        <h1>AI Annotate Helper</h1>
        <nav>
          <ul>
            <li>
              <a href="index.html">Home</a>
            </li>
            <li>
              <a href="about.html">About</a>
            </li>
            <li>
              <a href="contact.html">Contact</a>
            </li>
          </ul>
        </nav>
      </header>
      <main>
        <section>
          <h2>Introduction</h2>
          <p>
            This is the home page of my project. Here you can find information
            about the project and its purpose.
          </p>
        </section>
        <section>
          <h2>Upload CSV</h2>
          <form action="/upload" method="post" enctype="multipart/form-data">
            <label htmlFor="csvFile">Choose CSV file:</label>
            <input type="file" id="csvFile" name="csvFile" accept=".csv" />
            <button type="submit">Upload</button>
          </form>
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
                Assign 'Exclude' to 'decision' field if any following criteria
                are met, if not, assign 'Include' to the 'decision' field:
              </p>
              <ul>
                <li>
                  1. About the population, exclude it if the study focuses on
                  plants (vascular or non-vascular), rather than soil taxa
                  (terrestrial and semi-aquatic, including microorganisms,
                  invertebrates, and vertebrates)
                </li>
                <li>
                  2. About the intervention, exclude it if the study compares
                  organic vs. conventional farming systems, any agricultural
                  system, rather than using study specific organic fertilizers
                  and amendments (e.g., sewage sludge, compost, animal manure,
                  industrial waste …, positive/negative, direct/indirect) at
                  lab, field, or farm scale.
                </li>
                <li>
                  3. About the comparator, exclude it if the study has no
                  comparator, rather than mineral fertilization or another
                  organic fertilizer/amendment.
                </li>
                <li>
                  4. About the eligible study types, exclude it if the study is
                  modelling studies, rather than primary empirical research and
                  secondary research.
                </li>
              </ul>
            </div>
          </div>
        </section>
        <section>
          <h2>Choose LLM</h2>
          <form id="llmForm">
            <label htmlFor="llmSelect">Choose LLM:</label>
            <select id="llmSelect" name="llmSelect">
              <option value="gpt-3">GPT-3</option>
              <option value="gpt-4">GPT-4</option>
              <option value="bert">BERT</option>
              <option value="t5">T5</option>
            </select>
            <button type="button" onClick={addLLM}>
              Add LLM
            </button>
          </form>
        </section>
        <section>
          <h2>Filter Results</h2>
          <div className="controls">
            <label htmlFor="toggleInconsistent">
              Show only inconsistent rows
            </label>
            <input
              type="checkbox"
              id="toggleInconsistent"
              onClick={toggleInconsistentRows}
            />
            <label htmlFor="rowsPerPage">Rows per page:</label>
            <select id="rowsPerPage" onChange={changeRowsPerPage}>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <button className="export-button" onClick={exportToJson}>
              Export to JSON
            </button>
          </div>
          <div id="llmTabs"></div>
          <div id="llmResults"></div>
          <table id="resultsTable">
            <thead>
              <tr>
                <th>Article Title</th>
                <th>Open AI</th>
                <th>Mistral AI</th>
                <th>DeepSeek</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Article 1</td>
                <td onClick={(e) => toggleDecision(e.target)}>Include</td>
                <td onClick={(e) => toggleDecision(e.target)}>Exclude</td>
                <td onClick={(e) => toggleDecision(e.target)}>Include</td>
              </tr>
              <tr>
                <td>Article 2</td>
                <td onClick={(e) => toggleDecision(e.target)}>Exclude</td>
                <td onClick={(e) => toggleDecision(e.target)}>Include</td>
                <td onClick={(e) => toggleDecision(e.target)}>Exclude</td>
              </tr>
            </tbody>
          </table>
          <div className="pagination">
            <button onClick={previousPage}>Previous</button>
            <span id="pageNumbers"></span>
            <button onClick={nextPage}>Next</button>
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
