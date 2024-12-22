const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "storage.json");

// Initialize storage file if it doesn't exist
if (!fs.existsSync(logFile)) {
  fs.writeFileSync(logFile, JSON.stringify([]));
}

// Function to log requests
function logRequest(req) {
  const requestDetails = {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body,
    timestamp: new Date().toISOString(),
  };

  // Append request to the log file
  const logs = JSON.parse(fs.readFileSync(logFile));
  logs.push(requestDetails);
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
}

// Function to save logs (optional external call)
function saveLogs(data) {
  fs.writeFileSync(logFile, JSON.stringify(data, null, 2));
}

module.exports = { logRequest, saveLogs };
