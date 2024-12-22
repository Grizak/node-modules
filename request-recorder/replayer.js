const axios = require("axios");
const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "storage.json");

// Function to replay requests
async function replayRequests(filter = {}) {
  const logs = JSON.parse(fs.readFileSync(logFile));

  // Filter logs if criteria are provided
  const filteredLogs = logs.filter((log) => {
    return Object.keys(filter).every((key) => log[key] === filter[key]);
  });

  // Replay each request and capture responses
  const responses = [];
  for (const log of filteredLogs) {
    try {
      const response = await axios({
        method: log.method,
        url: log.url,
        headers: log.headers,
        data: log.body,
      });
      responses.push({
        url: log.url,
        status: response.status,
        data: response.data,
      });
    } catch (error) {
      responses.push({ url: log.url, error: error.message });
    }
  }

  return responses;
}

module.exports = { replayRequests };
