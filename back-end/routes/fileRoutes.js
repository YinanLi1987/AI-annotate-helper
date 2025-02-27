const express = require("express");
const router = express.Router();
const multer = require("multer");
const fileController = require("../controllers/fileController");
const llmController = require("../controllers/llmController");

router.post("/upload", fileController.uploadFile);
router.delete("/delete/:filename", fileController.deleteFile);
router.post("/save-prompt", fileController.savePrompt);
router.post("/create-fine-tuning-data", fileController.createFineTuningData);
router.post("/upload-training-data", llmController.uploadTrainingData);
router.post("/fine-tune-llm", llmController.fineTuneLLM);
router.post(
  "/process-csv-with-fine-tuned-llm",
  upload.single("csvFile"),
  llmController.processCSVWithFineTunedLLM
);
module.exports = router;
