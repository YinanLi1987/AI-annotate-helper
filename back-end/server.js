const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileRoutes = require("./routes/fileRoutes");

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors()); // Enable CORS
// Use the file routes
app.use("/", fileRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
