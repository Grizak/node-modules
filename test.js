const logManager = require("./app");

const logger = new logManager();

logger.info("Server running");
logger.error("DB connection error");
