const logManager = require("./app");

const logger = new logManager({
  startWebServer: true,
});

logger.info("Server running");
logger.error("DB connection error");
