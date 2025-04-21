const logger = require("./app")({
  startWebServer: true,
  enableCharts: true,
  enableMetrics: true,
  allowedIPs: ["::1"],
  compressOldLogs: true,
  levels: ["info", "error", "warn", "debug", "critical"],
});

logger.info("Server running");
logger.error("DB connection error");

logger.critical("Critical error occurred", {
  code: 500,
  message: "Internal Server Error",
});

logger.on("log", (message) => {
  if (message.level === "info") {
    console.log("Info logged:", message);
  } else if (message.level === "error") {
    console.log("Error logged:", message);
  } else if (message.level === "critical") {
    console.log("Critical error logged:", message);
  } else if (message.level === "warn") {
    console.log("Warning logged:", message);
  } else if (message.level === "debug") {
    console.log("Debug info logged:", message);
  }
});
