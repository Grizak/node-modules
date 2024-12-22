const express = require("express");
const nodeloggerg = require("nodeloggerg");
const { logRequest, saveLogs } = require("./logger");
const { replayRequests } = require("./replayer");

const app = express();
app.use(express.json());

const logger = new nodeloggerg({
  consoleOnly: true,
});

function middleware() {
  return (req, res, next) => {
    logRequest(req);
    next();
  };
}

// Route to replay requests
app.post("/replay", async (req, res) => {
  const { filter } = req.body; // Optional filter
  const responses = await replayRequests(filter);
  res.json({ responses });
});

// Start the server (for testing)
app.listen(3000, () => logger.info("Server started on port 3000"));

// Make the export into the correct structure before exporting it
const requestRecorder = Object.assign(middleware, {
  logRequest,
  saveLogs,
  replayRequests,
});

module.exports = requestRecorder;
