const path = require("path");
const fs = require("fs");
const multer = require("multer");
const csv = require("csv-parser");

// Set up storage engine
const storage = multer.diskStorage({
  destination: "./data/uploads",
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

// Ensure directory exists
function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

// Upload file
exports.uploadFile = (req, res) => {
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
};

// Delete file
exports.deleteFile = (req, res) => {
  const filePath = path.join(__dirname, "../data/uploads", req.params.filename);
  fs.unlink(filePath, (err) => {
    if (err) {
      res.status(400).send({ message: "File not found!" });
    } else {
      res.send({ message: "File deleted!" });
    }
  });
};

// Save prompt
exports.savePrompt = (req, res) => {
  const prompt = req.body.prompt;
  const timestamp = Date.now();
  const filePath = path.join(
    __dirname,
    "../data/prompts",
    `prompt-${timestamp}.txt`
  );

  // Ensure the directory exists
  ensureDirectoryExistence(filePath);

  // Delete previous prompt files
  const promptDir = path.join(__dirname, "../data/prompts");
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
};

// Create fine-tuning data and save locally
exports.createFineTuningData = (req, res) => {
  const prompt = req.body.prompt;
  const csvFile = req.body.csvFile;
  const timestamp = Date.now();
  const trainFilePath = path.join(
    __dirname,
    "../data/fine-tuning",
    `train-${timestamp}.jsonl`
  );
  const valFilePath = path.join(
    __dirname,
    "../data/fine-tuning",
    `val-${timestamp}.jsonl`
  );

  // Ensure the directories exist
  ensureDirectoryExistence(trainFilePath);
  ensureDirectoryExistence(valFilePath);

  const results = [];
  fs.createReadStream(path.join(__dirname, "../data/uploads", csvFile))
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      const jsonlData = results.map((row) => {
        const userContent = Object.keys(row)
          .filter((key) => key.toLowerCase() !== "decision")
          .map((key) => row[key])
          .join(" ");

        const decisionKey = Object.keys(row).find(
          (key) => key.toLowerCase() === "decision"
        );

        return JSON.stringify({
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: userContent },
            { role: "assistant", content: row[decisionKey] },
          ],
        });
      });

      // Split data into training (90%) and validation (10%)
      const trainData = jsonlData.slice(0, Math.floor(jsonlData.length * 0.9));
      const valData = jsonlData.slice(Math.floor(jsonlData.length * 0.9));

      // Write training data to file
      fs.writeFile(trainFilePath, trainData.join("\n"), (err) => {
        if (err) {
          console.error("Failed to create training data:", err);
          res.status(500).send({ message: "Failed to create training data." });
          return;
        }

        // Write validation data to file
        fs.writeFile(valFilePath, valData.join("\n"), (err) => {
          if (err) {
            console.error("Failed to create validation data:", err);
            res
              .status(500)
              .send({ message: "Failed to create validation data." });
            return;
          }

          res.send({
            message: "Fine-tuning data created successfully.",
            trainFile: trainFilePath,
            valFile: valFilePath,
          });
        });
      });
    });
};
