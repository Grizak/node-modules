const logger = require("./app")({
  startWebServer: true,
  enableCharts: true,
  enableMetrics: true,
  allowedIPs: ["::1"],
});

logger.info("Server running");
logger.error("DB connection error");
