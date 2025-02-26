const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");

router.post("/upload", fileController.uploadFile);
router.delete("/delete/:filename", fileController.deleteFile);
router.post("/save-prompt", fileController.savePrompt);
router.post("/create-fine-tuning-data", fileController.createFineTuningData);

module.exports = router;
