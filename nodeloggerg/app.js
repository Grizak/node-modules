// @ts-nocheck

const path = require("path");
const fs = require("fs");
const http = require("http");
const zlib = require("zlib");
const util = require("util");
const stream = require("stream");
const EventEmitter = require("events");
const os = require("os");
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const socketIo = require("socket.io");
const mongoose = require("mongoose");

const pipeline = util.promisify(stream.pipeline);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * SMTP Configuration options for Nodemailer
 * @typedef {Object} SMTPConfig
 *
 * @property {string} host - The hostname or IP address of the SMTP server to connect to (e.g., 'smtp.gmail.com', 'smtp.office365.com')
 * @property {number} [port=587] - The port to connect to (defaults to 587 if secure is false, 465 if secure is true)
 * @property {boolean} [secure=false] - If true, the connection will use TLS when connecting. If false, TLS is used if server supports STARTTLS extension
 *
 * @property {Object} [auth] - Authentication credentials
 * @property {string} [auth.user] - Username for authentication (usually the email address)
 * @property {string} [auth.pass] - Password for authentication
 * @property {string} [auth.type='login'] - Authentication type ('login', 'oauth2', etc.)
 *
 * @property {Object} [oauth2] - OAuth2 configuration (required if auth.type is 'oauth2')
 * @property {string} [oauth2.user] - User email address
 * @property {string} [oauth2.clientId] - OAuth Client ID
 * @property {string} [oauth2.clientSecret] - OAuth Client Secret
 * @property {string} [oauth2.refreshToken] - OAuth Refresh Token
 * @property {string} [oauth2.accessToken] - OAuth Access Token
 * @property {number} [oauth2.expires] - Access token expiration timestamp in milliseconds
 *
 * @property {boolean} [pool=false] - If true, creates a connection pool
 * @property {number} [maxConnections=5] - Maximum number of connections to pool (defaults to 5)
 * @property {number} [maxMessages] - Maximum number of messages to send using a single connection (defaults to 100)
 *
 * @property {number} [tls.rejectUnauthorized=true] - Reject self-signed or invalid TLS certificates
 * @property {Object} [tls] - Additional TLS options (see Node.js TLS docs)
 *
 * @property {number} [connectionTimeout=60000] - Connection timeout in milliseconds (defaults to 60000)
 * @property {number} [greetingTimeout=30000] - How long to wait for the greeting after connection (defaults to 30000)
 * @property {number} [socketTimeout=60000] - How long to wait for socket operations (defaults to 60000)
 *
 * @property {string} [localAddress] - Local interface to bind to for network connections
 * @property {string} [name] - Hostname to be used for identifying to the server
 * @property {boolean} [ignoreTLS=false] - If true, does not try to use STARTTLS even if available
 * @property {boolean} [requireTLS=false] - If true, forces the use of STARTTLS even if not advertised
 * @property {boolean} [opportunisticTLS=true] - If true, uses STARTTLS when available
 *
 * @property {Object} [logger=false] - Logger instance (defaults to false)
 * @property {boolean} [debug=false] - If true, outputs debug information to console
 * @property {function} [transactionLog] - Function to be called with mail envelope and delivery info
 *
 * @property {Object} [proxy] - Proxy URL configuration object for making the connection through a proxy
 * @property {string} [proxy.host] - Hostname of the proxy server
 * @property {number} [proxy.port] - Port of the proxy server
 * @property {string} [proxy.auth] - Proxy authentication as 'user:pass'
 *
 * @property {string} [dsn] - DSN parameters for requesting delivery status notification
 * @property {boolean} [dsn.ret] - Return either the full message ('FULL') or only headers ('HDRS')
 * @property {Object} [dkim] - DKIM signing options
 */

/**
 * @typedef {Object} Auth
 * @property {String} [user] - Username to log in
 * @property {String} [pass] - Password to log in
 * @property {Boolean} [bypassIpCheck] - Whether to use the ip matching functionality or not
 */

/**
 * @typedef {Array<Object>} EmailAlerts
 * @property {String} [level] - The level to look for when sending emails
 * @property {SMTPConfig} [smpt] - Smtp config for nodemailer
 * @property {String} [from] - Who to send the emails from
 * @property {String} [to] - Whom to send the emails to
 * @property {String} [subject] - Subject to include in the emails
 */

/**
 * @typedef {Object} ServerConfig
 * @property {boolean} [enableSearch] - Whether to enable search functionality in the web interface.
 * @property {boolean} [enableCharts] - Whether to enable chart visualizations in the web interface.
 * @property {Auth} [auth] - Auth for the web server
 * @property {Array<string>} [allowedIPs] - An array of allowed IP addresses for accessing the web server.
 * @property {boolean} [authEnabled] - Whether to require authentication when accessing the web server.
 * @property {number} [serverPort] - The port on which the log viewer server will run.
 * @property {boolean} [startWebServer] - If true, starts a web server to view logs.
 * @property {boolean} [enableRealtime] - If true, enables real-time updates via Socket.IO.
 */

/**
 * @typedef {Object} dbConfig
 * @property {String} [type] - The databse type. Accepted types is "mongodb" and "sql"
 * @property {String} [mongodb.collectionName] - What the database collection should be called
 * @property {mongoose.SchemaDefinition} [mongodb.schema] - The database schema (For mongodb)
 * @property {String} [mongodb.uri] - The uri for mongodb to connect to
 */

/**
 * @typedef {Object} LogManagerOptions
 * @property {string} [logFile] - The path to the log file.
 * @property {Array<string>} [levels] - An array of log levels (e.g., "info", "warn", "error", "debug").
 * @property {boolean} [consoleOnly] - If true, logs will only appear in the console.
 * @property {boolean} [fileOnly] - If true, logs will only be written to a file.
 * @property {function(string, string, string): string} [logFormat] - A custom function to format log messages.
 * @property {boolean} [compressOldLogs] - Whether to compress old log files when rotating.
 * @property {boolean} [enableMetrics] - Whether to track logging metrics.
 * @property {EmailAlerts} [emailAlerts] - Configuration for email alerts.
 * @property {dbConfig} [dbConfig] - Database configuration for log persistence.
 * @property {string} [logDir] - Directory for storing multiple log files.
 * @property {ServerConfig} [serverConfig] - Config for the web server
 * @property {string} [logLevel] - The default log level that the `log` function uses
 */

/**
 * Log manager instance with extensive logging capabilities and web interface
 * @typedef {Object} LogManager
 *
 * @property {function(string, ...any): Promise<LogEntry>} log - Core logging function that accepts a level and any number of arguments
 *
 * @property {function(...any): Promise<LogEntry>} info - Log an info message
 * @property {function(...any): Promise<LogEntry>} warn - Log a warning message
 * @property {function(...any): Promise<LogEntry>} error - Log an error message
 * @property {function(...any): Promise<LogEntry>} debug - Log a debug message
 *
 * @property {function(): Promise<void>} startServer - Start the web server for viewing logs
 *
 * @property {function(): LogManagerOptions} getConfig - Get the current configuration object
 * @property {function(Partial<LogManagerOptions>): LogManagerOptions} updateConfig - Update configuration with new values and return merged config
 *
 * @property {function(): Object|null} getMetrics - Get logging metrics (returns null if metrics disabled)
 * @property {Object} getMetrics.return - Metrics object when enabled
 * @property {number} getMetrics.return.totalLogs - Total number of logs recorded
 * @property {Object<string, number>} getMetrics.return.logsByLevel - Count of logs by level
 * @property {Array<{timestamp: string, count: number}>} getMetrics.return.logsPerMinute - Logs per minute history
 * @property {number} getMetrics.return.errorsPerMinute - Number of errors in current minute
 * @property {number} getMetrics.return.lastMinuteTimestamp - Timestamp of last minute boundary
 *
 * @property {function(string, function): {remove: function}} on - Subscribe to log events, returns object with remove method
 * @property {function(string, function): void} off - Unsubscribe from log events
 *
 * @property {function(): number} getConnectedClients - Get number of connected Socket.IO clients
 * @property {function(string, any): void} broadcastToClients - Broadcast data to all connected clients via Socket.IO
 *
 * @property {function(string, string, string, string): Array<LogEntry>} filterLogs - Filter logs by level, search term, start date, and end date
 * @property {function(Array<LogEntry>): string} exportLogsAsCsv - Export log entries as CSV string
 *
 * @property {function(string): Promise<string|null>} compressLogFile - Compress a log file using gzip
 * @property {function(): Array<LogFileInfo>} getLogFiles - Get information about all log files in the log directory
 *
 * @property {function(Partial<LogManagerOptions>): LogManager} createCustomLogger - Create a new log manager instance with custom configuration
 * @property {function(): String[]} regeneragteLogMethods - Regenerate the log methods
 * @property {function(): String[]} getAvailableLevels - Get all available log levels to use
 */

/**
 * Individual log entry object
 * @typedef {Object} LogEntry
 * @property {string} level - The log level (info, warn, error, debug, etc.)
 * @property {string} timestamp - ISO timestamp when log was created
 * @property {string} message - The raw log message
 * @property {string} formattedMessage - The formatted log message as it appears in files/console
 */

/**
 * Log file information object
 * @typedef {Object} LogFileInfo
 * @property {string} name - The filename
 * @property {string} path - Full path to the file
 * @property {number} size - File size in bytes
 * @property {Date} created - File creation date
 */

/**
 * Create a log manager instance with extensive logging capabilities
 *
 * @param {LogManagerOptions} [options={}] - Options to configure the LogManager.
 * @returns {LogManager} The log manager interface with logging methods and utilities
 */
function createLogManager(options = {}) {
  // ====== Configuration ======
  const config = {
    logFile: options.logFile || path.join(process.cwd(), "logs.txt"),
    levels: options.levels || ["info", "warn", "error", "debug"],
    consoleOnly: options.consoleOnly || false,
    fileOnly: options.fileOnly || false,
    serverPort: options.serverConfig?.serverPort || 9001,
    startWebServer: options.serverConfig?.startWebServer || false,
    enableRealtime:
      options.serverConfig?.enableRealtime !== undefined
        ? options.serverConfig.enableRealtime
        : true,
    logFormat:
      options.logFormat ||
      ((level, timestamp, message) =>
        `[${timestamp}] [${level.toUpperCase()}]: ${message}`),
    username: options.serverConfig?.auth?.user || "admin",
    password: options.serverConfig?.auth?.pass || "admin",
    allowedIPs: options.serverConfig?.allowedIPs || ["127.0.0.1", "::1"],
    authEnabled:
      options.serverConfig?.authEnabled !== undefined
        ? options.serverConfig.authEnabled
        : true,
    bypassIpCheck:
      options.serverConfig?.auth?.bypassIpCheck !== undefined
        ? options.serverConfig?.auth?.bypassIpCheck
        : false,
    compressOldLogs:
      options.compressOldLogs !== undefined ? options.compressOldLogs : true,
    enableMetrics:
      options.enableMetrics !== undefined ? options.enableMetrics : false,
    emailAlerts: options.emailAlerts || [],
    dbConfig: options.dbConfig || null,
    logDir: options.logDir || path.join(process.cwd(), "logs"),
    enableSearch:
      options.serverConfig?.enableSearch !== undefined
        ? options.serverConfig.enableSearch
        : true,
    enableCharts:
      options.serverConfig?.enableCharts !== undefined
        ? options.serverConfig.enableCharts
        : true,
    defaultLevel:
      options.logLevel ||
      (options.levels || ["info", "warn", "error", "debug"])[0],
  };

  // Validate configuration
  if (config.consoleOnly && config.fileOnly) {
    throw new Error("Cannot have both consoleOnly and fileOnly set to true.");
  }

  let loggerConnection = null;
  let LogModel = null;
  const defaultLogSchema = {
    level: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    message: { type: String, required: true },
    formattedMessage: { type: String },
    createdAt: { type: Date, default: Date.now, expires: "30d" }, // TTL for cleanup
  };

  async function initializeDatabase() {
    if (config.dbConfig?.type === "mongodb" && config.dbConfig.mongodb?.uri) {
      try {
        // Create a separate connection instance - doesn't affect global mongoose
        loggerConnection = mongoose.createConnection(
          config.dbConfig.mongodb.uri,
          {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
          }
        );

        console.log("Logger MongoDB connected successfully");

        // Create model on the specific connection
        if (
          config.dbConfig.mongodb.schema &&
          config.dbConfig.mongodb.collectionName
        ) {
          const logSchema = new mongoose.Schema(config.dbConfig.mongodb.schema);
          LogModel = loggerConnection.model(
            config.dbConfig.mongodb.collectionName,
            logSchema
          );
        } else {
          LogModel = loggerConnection.model("Logs", defaultLogSchema);
        }

        // Setup connection event handlers
        loggerConnection.on("error", (err) => {
          console.error("Logger MongoDB connection error:", err);
        });

        loggerConnection.on("disconnected", () => {
          console.warn("Logger MongoDB disconnected");
        });
      } catch (err) {
        console.error("Logger MongoDB connection failed:", err);
        loggerConnection = null;
      }
    }
  }

  // ====== Internal State ======
  const metrics = {
    totalLogs: 0,
    logsByLevel: {},
    logsPerMinute: [],
    errorsPerMinute: 0,
    lastMinuteTimestamp: Date.now(),
  };

  const logEmitter = new EventEmitter();
  const logBuffer = [];
  const MAX_BUFFER_SIZE = 1000;

  // Socket.IO instance
  let io = null;

  let logManagerInstance = {}; // The current public interface
  let currentLogMethods = {}; // Current log methods cache

  function generateLogMethods() {
    const newLogMethods = {};

    config.levels.forEach((level) => {
      newLogMethods[level] = (...args) => log(level, ...args);
    });

    return newLogMethods;
  }

  function updateLogMethods() {
    // Clear old methods from the instance
    Object.keys(currentLogMethods).forEach((level) => {
      delete logManagerInstance[level];
    });

    // Generate new methods
    currentLogMethods = generateLogMethods();

    // Add new methods to the instance
    Object.assign(logManagerInstance, currentLogMethods);

    console.log(
      `Log methods updated. Available levels: ${config.levels.join(", ")}`
    );
  }

  // Config update function
  function updateConfig(newConfig) {
    const oldLevels = [...config.levels]; // Store old levels for comparison

    // Update the config
    Object.assign(config, newConfig);

    // Check if levels have changed
    const levelsChanged =
      oldLevels.length !== config.levels.length ||
      !oldLevels.every((level, index) => level === config.levels[index]);

    if (levelsChanged) {
      console.log(
        `Log levels changed from [${oldLevels.join(
          ", "
        )}] to [${config.levels.join(", ")}]`
      );
      updateLogMethods();

      // Emit a config change event for subscribers
      logEmitter.emit("configChanged", {
        oldLevels,
        newLevels: [...config.levels],
        fullConfig: { ...config },
      });
    }
  }

  // Create logs directory if needed
  if (!config.consoleOnly && !fs.existsSync(config.logDir)) {
    fs.mkdirSync(config.logDir, { recursive: true });
  }

  // ====== Utility Functions ======
  function formatTimestamp() {
    const isoString = new Date().toISOString();
    const [date, time] = isoString.split("T");
    const formattedTime = time.slice(0, 8);
    return `${date} ${formattedTime}`;
  }

  function updateMetrics(level) {
    if (!config.enableMetrics) return;

    metrics.totalLogs++;
    metrics.logsByLevel[level] = (metrics.logsByLevel[level] || 0) + 1;

    const now = Date.now();
    if (now - metrics.lastMinuteTimestamp >= 60000) {
      metrics.logsPerMinute.push({
        timestamp: new Date(metrics.lastMinuteTimestamp).toISOString(),
        count: metrics.totalLogs,
      });

      // Keep only last 60 minutes of data
      if (metrics.logsPerMinute.length > 60) {
        metrics.logsPerMinute.shift();
      }

      metrics.errorsPerMinute = 0;
      metrics.lastMinuteTimestamp = now;
    }

    if (level === "error") {
      metrics.errorsPerMinute++;
    }
  }

  async function checkEmailAlerts(level, message) {
    if (!config.emailAlerts || config.emailAlerts.length === 0) return;

    for (const alertConfig of config.emailAlerts) {
      if (
        alertConfig.level === level &&
        (!alertConfig.pattern || message.includes(alertConfig.pattern))
      ) {
        try {
          const transporter = nodemailer.createTransporter(alertConfig.smtp);
          await transporter.sendMail({
            from: alertConfig.from,
            to: alertConfig.to,
            subject: alertConfig.subject || `Log Alert: ${level}`,
            text: `${formatTimestamp()}: ${message}`,
            html: `<p><strong>${formatTimestamp()}</strong>: ${message}</p>`,
          });
        } catch (err) {
          console.error("Failed to send email alert:", err);
        }
      }
    }
  }

  async function saveToDatabase(logEntry) {
    if (!config.dbConfig || !LogModel || !loggerConnection) return;

    try {
      // Check specific connection status (not global mongoose)
      if (loggerConnection.readyState !== 1) {
        console.warn("Logger MongoDB not connected, skipping database save");
        return;
      }

      await LogModel.create({
        level: logEntry.level,
        timestamp: new Date(logEntry.timestamp),
        message: logEntry.message,
        createdAt: new Date(),
        ...logEntry, // Include any additional fields
      });
    } catch (err) {
      console.error("Failed to save log to database:", err);

      // Optional: Add to retry queue or fallback mechanism
      if (err.name === "MongoNetworkError") {
        console.log("Network error - consider implementing retry logic");
      }
    }
  }

  async function compressLogFile(filePath) {
    if (!config.compressOldLogs) return;

    const gzipPath = `${filePath}.gz`;
    try {
      const source = fs.createReadStream(filePath);
      const destination = fs.createWriteStream(gzipPath);
      const gzip = zlib.createGzip();

      await pipeline(source, gzip, destination);
      await fs.promises.unlink(filePath);

      return gzipPath;
    } catch (err) {
      console.error("Error compressing log file:", err);
      return null;
    }
  }

  // ====== Socket.IO Functions ======
  function notifyClientsNewLog(logEntry) {
    if (io && config.enableRealtime) {
      io.emit("newLog", {
        level: logEntry.level,
        timestamp: logEntry.timestamp,
        message: logEntry.message,
        formattedMessage: logEntry.formattedMessage,
      });
    }
  }

  function notifyClientsMetricsUpdate() {
    if (io && config.enableRealtime && config.enableMetrics) {
      io.emit("metricsUpdate", metrics);
    }
  }

  function notifyClientsLogRotation() {
    if (io && config.enableRealtime) {
      io.emit("logRotation");
    }
  }

  // ====== Core Logging Function ======
  async function log(level, ...args) {
    // Fixed: Better handling of custom log levels
    if (!config.levels.includes(level)) {
      // If level is not recognized, treat it as a message and use default level
      args.unshift(level);
      level = config.defaultLevel;
    }

    const message = args
      .map((arg) => {
        if (arg instanceof Error) {
          return `${arg.message} \n${arg.stack}`;
        } else if (typeof arg === "object") {
          return JSON.stringify(arg, Object.getOwnPropertyNames(arg));
        }
        return String(arg);
      })
      .join(" ");

    const timestamp = formatTimestamp();
    const formattedMessage = config.logFormat(level, timestamp, message);

    const logEntry = {
      level,
      timestamp,
      message,
      formattedMessage,
    };

    // Update metrics
    updateMetrics(level);

    // Buffer the log for in-memory access
    logBuffer.push(logEntry);

    // Limit buffer size
    if (logBuffer.length > MAX_BUFFER_SIZE) {
      logBuffer.shift();
    }

    // Emit log event for subscribers
    logEmitter.emit("log", logEntry);

    // Notify connected clients via Socket.IO
    notifyClientsNewLog(logEntry);

    // Check for email alerts
    await checkEmailAlerts(level, message);

    // Save to database if configured
    if (config.dbConfig) {
      saveToDatabase(logEntry);
    }

    // Console output
    if (!config.fileOnly) {
      const colorize = !config.consoleOnly; // Only colorize if we're also writing to file
      let consoleMsg = formattedMessage;

      if (colorize) {
        const colors = {
          info: "\x1b[36m%s\x1b[0m", // Cyan
          warn: "\x1b[33m%s\x1b[0m", // Yellow
          error: "\x1b[31m%s\x1b[0m", // Red
          debug: "\x1b[35m%s\x1b[0m", // Magenta
        };
        console.log(colors[level] || "%s", consoleMsg);
      } else {
        console.log(consoleMsg);
      }
    }

    // File output
    if (!config.consoleOnly) {
      try {
        // Create log file if it doesn't exist
        const logFile = path.join(
          config.logDir,
          path.parse(config.logFile).base
        );

        if (fs.existsSync(logFile)) {
          const stats = await fs.promises.stat(logFile);
          if (stats.size >= MAX_FILE_SIZE) {
            const archiveFile = logFile.replace(
              ".txt",
              `_${formatTimestamp().replace(/[: ]/g, "-")}.txt`
            );
            await fs.promises.rename(logFile, archiveFile);

            // Compress old log file if enabled
            if (config.compressOldLogs) {
              await compressLogFile(archiveFile);
            }

            // Notify clients about log rotation
            notifyClientsLogRotation();
          }
        }

        await fs.promises.appendFile(logFile, formattedMessage + "\n", "utf8");
      } catch (err) {
        console.error("Error while handling log file:", err);
      }
    }

    // Notify clients about metrics update if needed
    if (config.enableMetrics) {
      notifyClientsMetricsUpdate();
    }

    // Return the log entry for chaining
    return logEntry;
  }

  // ====== Web Server Setup ======
  let server = null;

  async function startServer() {
    if (server) return; // Avoid starting multiple servers

    server = http.createServer(async (req, res) => {
      // Security headers
      const nonce = require("crypto")
        .randomBytes(require("crypto").randomInt(16, 48))
        .toString("base64")
        .replace(/[=+\/]/g, "");

      res.setHeader(
        "Content-Security-Policy",
        `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://cdnjs.cloudflare.com; style-src 'self' 'nonce-${nonce}' https://cdnjs.cloudflare.com; img-src 'self' data:; connect-src 'self' ws: wss:;`
      );
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("X-XSS-Protection", "1; mode=block");
      res.setHeader("Referrer-Policy", "no-referrer");
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("X-Powered-By", "Nodeloggerg");

      // Authorization check
      if (config.authEnabled) {
        const clientIP = req.socket.remoteAddress;

        if (!config.bypassIpCheck) {
          if (!config.allowedIPs.includes(clientIP)) {
            res.writeHead(403, { "Content-Type": "text/plain" });
            res.end("Access denied: Your IP is not authorized.");
            return;
          }
        }

        const auth = req.headers["authorization"];

        if (!auth || auth.indexOf("Basic ") === -1) {
          res.writeHead(401, {
            "WWW-Authenticate": 'Basic realm="Secure Area"',
          });
          res.end("Authorization required.");
          return;
        }

        const credentials = Buffer.from(auth.split(" ")[1], "base64").toString(
          "utf8"
        );
        const [user, pass] = credentials.split(":");

        if (user !== config.username || pass !== config.password) {
          res.writeHead(401, {
            "WWW-Authenticate": 'Basic realm="Secure Area"',
          });
          res.end("Authorization required.");
          return;
        }
      }

      // Parse URL and query parameters
      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathname = url.pathname;
      const params = url.searchParams;

      // Route handling
      if (pathname === "/") {
        res.writeHead(200, { "Content-Type": "text/html" });
        const htmlPage = await generateHtmlPage(nonce);
        res.end(htmlPage);
      } else if (pathname === "/logs") {
        const level = params.get("level") || "";
        const search = params.get("search") || "";
        const startDate = params.get("startDate") || "";
        const endDate = params.get("endDate") || "";
        const format = params.get("format") || "text";

        if (format === "json") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify(filterLogs(level, search, startDate, endDate))
          );
        } else if (format === "csv") {
          res.writeHead(200, {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="logs_${formatTimestamp().replace(
              /[: ]/g,
              "-"
            )}.csv"`,
          });
          res.end(
            exportLogsAsCsv(filterLogs(level, search, startDate, endDate))
          );
        } else {
          res.writeHead(200, { "Content-Type": "text/plain" });
          if (
            fs.existsSync(
              path.join(config.logDir, path.parse(config.logFile).base)
            )
          ) {
            const logStream = fs.createReadStream(
              path.join(config.logDir, path.parse(config.logFile).base),
              { encoding: "utf8" }
            );

            // Apply filters if needed
            if (level || search || startDate || endDate) {
              const filteredLogs = filterLogs(level, search, startDate, endDate)
                .map((log) => log.formattedMessage)
                .join("\n");
              res.end(filteredLogs);
            } else {
              logStream.pipe(res);
              logStream.on("error", (err) => {
                console.error("Error reading log file:", err);
                res.end("Error reading log file");
              });
            }
          } else {
            res.end("No logs yet!");
          }
        }
      } else if (pathname === "/metrics") {
        if (!config.enableMetrics) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Metrics not enabled");
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(metrics));
      } else if (pathname === "/files") {
        // List available log files
        try {
          const files = fs
            .readdirSync(config.logDir)
            .filter((file) => file.endsWith(".txt") || file.endsWith(".gz"))
            .map((file) => {
              const stats = fs.statSync(path.join(config.logDir, file));
              return {
                name: file,
                size: stats.size,
                created: stats.birthtime,
              };
            });

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(files));
        } catch (err) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Error reading log directory");
        }
      } else if (pathname.startsWith("/download/")) {
        const fileName = pathname.replace("/download/", "");
        const filePath = path.join(config.logDir, fileName);

        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          const isGzip = fileName.endsWith(".gz");

          res.writeHead(200, {
            "Content-Type": isGzip ? "application/gzip" : "text/plain",
            "Content-Disposition": `attachment; filename="${fileName}"`,
            "Content-Length": stats.size,
          });

          const fileStream = fs.createReadStream(filePath);
          fileStream.pipe(res);
        } else {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("File not found");
        }
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      }
    });

    // Initialize Socket.IO if real-time is enabled
    if (config.enableRealtime) {
      io = socketIo(server, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
        },
        transports: ["websocket", "polling"],
      });

      io.on("connection", (socket) => {
        console.log("\x1b[36m%s\x1b[0m", `Client connected: ${socket.id}`);

        // Send current metrics on connection if available
        if (config.enableMetrics) {
          socket.emit("metricsUpdate", metrics);
        }

        // Send recent logs from buffer
        if (logBuffer.length > 0) {
          socket.emit("initialLogs", logBuffer.slice(-50)); // Send last 50 logs
        }

        socket.on("disconnect", () => {
          console.log("\x1b[36m%s\x1b[0m", `Client disconnected: ${socket.id}`);
        });

        socket.on("requestLogs", (filters) => {
          try {
            const filteredLogs = filterLogs(
              filters.level || "",
              filters.search || "",
              filters.startDate || "",
              filters.endDate || ""
            );
            socket.emit("logsData", filteredLogs);
          } catch (err) {
            socket.emit("error", {
              message: "Error filtering logs",
              error: err.message,
            });
          }
        });

        socket.on("requestMetrics", () => {
          if (config.enableMetrics) {
            socket.emit("metricsUpdate", metrics);
          } else {
            socket.emit("error", { message: "Metrics not enabled" });
          }
        });
      });
    }

    server.listen(config.serverPort, () => {
      console.log(
        "\x1b[36m%s\x1b[0m",
        `Log Viewer running at http://localhost:${config.serverPort}`
      );
      if (config.enableRealtime) {
        console.log("\x1b[36m%s\x1b[0m", `Socket.IO real-time updates enabled`);
      }
    });
  }

  // ====== Helper Functions for Web UI ======
  function filterLogs(level, search, startDate, endDate) {
    let logs = [];

    // Fixed: Always read from file first to get complete history
    const logFile = path.join(config.logDir, path.parse(config.logFile).base);

    // Read from file if it exists
    if (fs.existsSync(logFile)) {
      try {
        const content = fs.readFileSync(logFile, "utf8");

        const fileLogs = content
          .split("\n")
          .filter((line) => line.trim() !== "")
          .map((line) => {
            // Fixed: Better parsing to handle custom log levels
            const timestampMatch = line.match(/\[([\d-]+ [\d:]+)\]/);
            // Fixed: Use a more flexible regex that captures any level in brackets
            const levelMatch = line.match(/\]\s*\[([^\]]+)\]:/);

            // Extract the actual message after the log format
            let message = line;
            if (timestampMatch && levelMatch) {
              const afterLevel = line.indexOf("]:") + 2;
              message =
                afterLevel > 1 ? line.substring(afterLevel).trim() : line;
            }

            return {
              formattedMessage: line,
              timestamp: timestampMatch ? timestampMatch[1] : "",
              level: levelMatch ? levelMatch[1].toLowerCase() : "",
              message: message,
            };
          });

        logs.push(...fileLogs);
      } catch (err) {
        console.error("Error reading log file for filtering:", err);
      }
    }

    // Fixed: Merge with in-memory logs (remove duplicates based on timestamp + message)
    if (logBuffer.length > 0) {
      const existingKeys = new Set(
        logs.map((log) => `${log.timestamp}-${log.message}`)
      );

      const newLogs = logBuffer.filter((log) => {
        const key = `${log.timestamp}-${log.message}`;
        return !existingKeys.has(key);
      });

      logs.push(...newLogs);
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB - dateA;
    });

    // Apply filters
    return logs.filter((log) => {
      let include = true;

      // Fixed: Better level filtering that handles custom levels
      if (level && level.trim() !== "") {
        const filterLevel = level.toLowerCase().trim();
        const logLevel = (log.level || "").toLowerCase().trim();
        if (logLevel !== filterLevel) {
          include = false;
        }
      }

      if (search && search.trim() !== "") {
        const searchTerm = search.toLowerCase();
        const searchableText =
          `${log.message} ${log.formattedMessage}`.toLowerCase();
        if (!searchableText.includes(searchTerm)) {
          include = false;
        }
      }

      if (startDate && startDate.trim() !== "") {
        try {
          const logDate = new Date(log.timestamp);
          const filterDate = new Date(startDate);
          if (isNaN(logDate.getTime()) || logDate < filterDate) {
            include = false;
          }
        } catch (err) {
          // If date parsing fails, skip this filter
        }
      }

      if (endDate && endDate.trim() !== "") {
        try {
          const logDate = new Date(log.timestamp);
          const filterDate = new Date(endDate);
          if (isNaN(logDate.getTime()) || logDate > filterDate) {
            include = false;
          }
        } catch (err) {
          // If date parsing fails, skip this filter
        }
      }

      return include;
    });
  }

  function exportLogsAsCsv(logs) {
    const header = "Timestamp,Level,Message\n";
    const rows = logs
      .map((log) => {
        const timestamp = log.timestamp || "";
        const level = log.level || "";
        // Escape quotes and commas in message
        const message = (log.message || "")
          .replace(/"/g, '""')
          .replace(/\n/g, " ");

        return `"${timestamp}","${level}","${message}"`;
      })
      .join("\n");

    return header + rows;
  }

  async function generateHtmlPage(nonce) {
    return await ejs.renderFile(path.join(__dirname, "webpage.ejs"), {
      nonce,
      config,
    });
  }

  // ====== Public Interface ======
  if (config.startWebServer) {
    startServer();
  }

  // Initial setup
  updateLogMethods();
  initializeDatabase();

  // Public interface
  logManagerInstance = {
    // Core logging methods
    log,
    ...currentLogMethods,

    // Server control
    startServer,

    // Configuration methods
    getConfig: () => ({ ...config }),
    updateConfig,

    regeneragteLogMethods: () => {
      updateLogMethods();
      return Object.keys(currentLogMethods);
    },

    getAvailableLevels: () => [...config.levels],

    // Metrics
    getMetrics: () => (config.enableMetrics ? { ...metrics } : null),

    // Events
    on: (event, callback) => {
      logEmitter.on(event, callback);

      return {
        remove: logEmitter.off(event, callback),
      };
    },
    off: (event, callback) => {
      logEmitter.off(event, callback);
    },

    // Socket.IO methods
    getConnectedClients: () => {
      if (io) {
        return io.engine.clientsCount;
      }
      return 0;
    },

    broadcastToClients: (event, data) => {
      if (io && config.enableRealtime) {
        io.emit(event, data);
      }
    },

    // Utility methods
    filterLogs,
    exportLogsAsCsv,

    // File management
    compressLogFile,
    getLogFiles: () => {
      try {
        return fs
          .readdirSync(config.logDir)
          .filter((file) => file.endsWith(".txt") || file.endsWith(".gz"))
          .map((file) => {
            const stats = fs.statSync(path.join(config.logDir, file));
            return {
              name: file,
              path: path.join(config.logDir, file),
              size: stats.size,
              created: stats.birthtime,
            };
          });
      } catch (err) {
        console.error("Error reading log directory:", err);
        return [];
      }
    },

    // Advanced
    createCustomLogger: (customConfig) => {
      return createLogManager({
        ...config,
        ...customConfig,
      });
    },
  };

  return logManagerInstance;
}

module.exports = createLogManager;
