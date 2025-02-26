// filepath: /Volumes/Media 2/agri/llm-anno-helper/server.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const app = express();
const port = 3001;
// Enable CORS
app.use(cors());
app.use(express.json());
// Set up storage engine
const storage = multer.diskStorage({
  destination: "./data/uploads/",
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // 1MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("csvFile");

// Check file type
function checkFileType(file, cb) {
  const filetypes = /csv/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: CSV Files Only!");
  }
}

// Upload endpoint
app.post("/upload", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.status(400).send({ message: err });
    } else {
      if (req.file == undefined) {
        res.status(400).send({ message: "No file selected!" });
      } else {
        res.send({
          message: "File uploaded!",
          file: `${req.file.originalname}`,
        });
      }
    }
  });
});
// Delete file endpoint
app.delete("/delete/:filename", (req, res) => {
  const filePath = path.join(__dirname, "data/uploads", req.params.filename);
  fs.unlink(filePath, (err) => {
    if (err) {
      res.status(400).send({ message: "File not found!" });
    } else {
      res.send({ message: "File deleted!" });
    }
  });
});

// Save prompt endpoint
app.post("/save-prompt", (req, res) => {
  const prompt = req.body.prompt;
  const timestamp = Date.now();
  const filePath = path.join(
    __dirname,
    "data/prompts",
    `prompt-${timestamp}.txt`
  );
  // Delete previous prompt files
  const promptDir = path.join(__dirname, "data/prompts");
  fs.readdir(promptDir, (err, files) => {
    if (err) {
      console.error("Failed to read prompt directory:", err);
    } else {
      files.forEach((file) => {
        fs.unlink(path.join(promptDir, file), (err) => {
          if (err) {
            console.error("Failed to delete prompt file:", err);
          }
        });
      });
    }

    // Save new prompt
    fs.writeFile(filePath, prompt, (err) => {
      if (err) {
        console.error("Failed to save prompt:", err);
        res.status(500).send({ message: "Failed to save prompt." });
      } else {
        res.send({ message: "Prompt saved successfully.", prompt });
      }
    });
  });
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
