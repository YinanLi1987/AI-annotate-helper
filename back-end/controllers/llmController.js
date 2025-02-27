require("dotenv").config();
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

exports.uploadTrainingData = async (req, res) => {
  const openai = new OpenAI(process.env.OPENAI_API_KEY); // Make sure to set your OpenAI API key in environment variables

  try {
    const trainDataPath = req.body.trainFile;
    const valDataPath = req.body.valFile;

    const trainData = fs.createReadStream(trainDataPath);
    const valData = fs.createReadStream(valDataPath);

    const trainFileResponse = await openai.files.create({
      file: trainData,
      purpose: "fine-tune",
    });

    const valFileResponse = await openai.files.create({
      file: valData,
      purpose: "fine-tune",
    });

    res.json({
      message: "Training and validation data uploaded successfully.",
      trainFileId: trainFileResponse.id,
      valFileId: valFileResponse.id,
    });
  } catch (error) {
    console.error("Error uploading training data:", error);
    res.status(500).json({ message: "Failed to upload training data." });
  }
};

exports.fineTuneLLM = async (req, res) => {
  const openai = new OpenAI(process.env.OPENAI_API_KEY); // Make sure to set your OpenAI API key in environment variables

  try {
    const { trainFileId, valFileId } = req.body;
    const startTime = Date.now();

    const job = await openai.fineTuning.jobs.create({
      training_file: trainFileId,
      validation_file: valFileId,
      model: "gpt-4o-mini-2024-07-18",
      method: {
        type: "supervised",
        supervised: {
          hyperparameters: {
            batch_size: 30,
            learning_rate_multiplier: 0.0001,
            n_epochs: 2,
          },
        },
      },
    });

    const jobId = job.id;
    let status;
    do {
      const jobStatus = await openai.fineTuning.jobs.retrieve(jobId);
      status = jobStatus.status;
      if (["succeeded", "failed", "cancelled"].includes(status)) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 30000)); // Check every 30 seconds
    } while (true);

    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / 1000;

    res.json({
      message: `Fine-tuning job ${jobId} completed with status: ${status}`,
      elapsedTime: `${elapsedTime.toFixed(2)} seconds`,
    });
  } catch (error) {
    console.error("Error during fine-tuning:", error);
    res.status(500).json({ message: "Failed to fine-tune the model." });
  }
};

exports.useFineTunedLLM = async (req, res) => {
  const openai = new OpenAI(process.env.OPENAI_API_KEY); // Make sure to set your OpenAI API key in environment variables

  try {
    const { prompt, model } = req.body;

    const response = await openai.completions.create({
      model: model,
      prompt: prompt,
      max_tokens: 100,
    });

    res.json({
      message: "Response from fine-tuned LLM",
      response: response.choices[0].text,
    });
  } catch (error) {
    console.error("Error using fine-tuned LLM:", error);
    res.status(500).json({ message: "Failed to use fine-tuned LLM." });
  }
};

exports.processCSVWithFineTunedLLM = async (req, res) => {
  const openai = new OpenAI(process.env.OPENAI_API_KEY); // Make sure to set your OpenAI API key in environment variables

  try {
    const { model } = req.body;
    const csvFilePath = req.file.path;
    const results = [];

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        for (const row of results) {
          const prompt = Object.values(row).join(" ");
          const response = await openai.completions.create({
            model: model,
            prompt: prompt,
            max_tokens: 100,
          });
          row.Decision = response.choices[0].text.trim();
        }

        const json2csvParser = new Parser();
        const csvData = json2csvParser.parse(results);

        const outputFilePath = path.join(
          __dirname,
          "../data/processed",
          `processed-${Date.now()}.csv`
        );
        fs.writeFileSync(outputFilePath, csvData);

        res.download(outputFilePath, "processed.csv", (err) => {
          if (err) {
            console.error("Error downloading the file:", err);
            res
              .status(500)
              .json({ message: "Failed to download the processed file." });
          }
        });
      });
  } catch (error) {
    console.error("Error processing CSV with fine-tuned LLM:", error);
    res
      .status(500)
      .json({ message: "Failed to process CSV with fine-tuned LLM." });
  }
};
