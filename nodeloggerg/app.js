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

const pipeline = util.promisify(stream.pipeline);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * @typedef {Object} LogManagerOptions
 * @property {string} [logFile] - The path to the log file.
 * @property {Array<string>} [levels] - An array of log levels (e.g., "info", "warn", "error", "debug").
 * @property {boolean} [consoleOnly] - If true, logs will only appear in the console.
 * @property {boolean} [fileOnly] - If true, logs will only be written to a file.
 * @property {number} [serverPort] - The port on which the log viewer server will run.
 * @property {boolean} [startWebServer] - If true, starts a web server to view logs.
 * @property {function(string, string, string): string} [logFormat] - A custom function to format log messages.
 * @property {string} [username] - The username for basic authentication when accessing the web server.
 * @property {string} [password] - The password for basic authentication when accessing the web server.
 * @property {Array<string>} [allowedIPs] - An array of allowed IP addresses for accessing the web server.
 * @property {boolean} [authEnabled] - Whether to require authentication when accessing the web server.
 * @property {boolean} [compressOldLogs] - Whether to compress old log files when rotating.
 * @property {boolean} [enableMetrics] - Whether to track logging metrics.
 * @property {Array<Object>} [emailAlerts] - Configuration for email alerts.
 * @property {Object} [dbConfig] - Database configuration for log persistence.
 * @property {string} [logDir] - Directory for storing multiple log files.
 * @property {boolean} [enableSearch] - Whether to enable search functionality in the web interface.
 * @property {boolean} [enableCharts] - Whether to enable chart visualizations in the web interface.
 */

/**
 * Create a log manager instance with extensive logging capabilities
 *
 * @param {LogManagerOptions} [options={}] - Options to configure the LogManager.
 * @returns {Object} The log manager interface with logging methods and utilities
 */
function createLogManager(options = {}) {
  // ====== Configuration ======
  const config = {
    logFile: options.logFile || path.join(process.cwd(), "logs.txt"),
    levels: options.levels || ["info", "warn", "error", "debug"],
    consoleOnly: options.consoleOnly || false,
    fileOnly: options.fileOnly || false,
    serverPort: options.serverPort || 9001,
    startWebServer: options.startWebServer || false,
    logFormat:
      options.logFormat ||
      ((level, timestamp, message) =>
        `[${timestamp}] [${level.toUpperCase()}]: ${message}`),
    username: options.username || "admin",
    password: options.password || "admin",
    allowedIPs: options.allowedIPs || ["127.0.0.1", "::1"],
    authEnabled: options.authEnabled !== undefined ? options.authEnabled : true,
    compressOldLogs:
      options.compressOldLogs !== undefined ? options.compressOldLogs : true,
    enableMetrics:
      options.enableMetrics !== undefined ? options.enableMetrics : false,
    emailAlerts: options.emailAlerts || [],
    dbConfig: options.dbConfig || null,
    logDir: options.logDir || path.join(process.cwd(), "logs"),
    enableSearch:
      options.enableSearch !== undefined ? options.enableSearch : true,
    enableCharts:
      options.enableCharts !== undefined ? options.enableCharts : true,
  };

  console.log("Log Manager Configuration:", config);

  // Validate configuration
  if (config.consoleOnly && config.fileOnly) {
    throw new Error("Cannot have both consoleOnly and fileOnly set to true.");
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
          const transporter = nodemailer.createTransport(alertConfig.smtp);
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

  async function saveToDatabase(level, timestamp, message) {
    if (!config.dbConfig) return;

    try {
      // Implementation would depend on database type
      // This is a placeholder for the database implementation
      if (config.dbConfig.type === "mongodb") {
        // MongoDB implementation would go here
      } else if (config.dbConfig.type === "sql") {
        // SQL implementation would go here
      }
    } catch (err) {
      console.error("Failed to save log to database:", err);
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

  // ====== Core Logging Function ======
  async function log(level, ...args) {
    if (!config.levels.includes(level)) {
      throw new Error(`Invalid log level: ${level}`);
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

    // Update metrics
    updateMetrics(level);

    // Buffer the log for in-memory access
    logBuffer.push({
      level,
      timestamp,
      message,
      formattedMessage,
    });

    // Limit buffer size
    if (logBuffer.length > MAX_BUFFER_SIZE) {
      logBuffer.shift();
    }

    // Emit log event for subscribers
    logEmitter.emit("log", { level, timestamp, message, formattedMessage });

    // Check for email alerts
    await checkEmailAlerts(level, message);

    // Save to database if configured
    if (config.dbConfig) {
      await saveToDatabase(level, timestamp, message);
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
          }
        }

        await fs.promises.appendFile(logFile, formattedMessage + "\n", "utf8");
      } catch (err) {
        console.error("Error while handling log file:", err);
      }
    }

    // Return the log entry for chaining
    return { level, timestamp, message, formattedMessage };
  }

  // ====== Web Server Setup ======
  let server = null;

  async function startServer() {
    if (server) return; // Avoid starting multiple servers

    server = await http.createServer(async (req, res) => {
      // Security headers
      const nonce = require("crypto")
        .randomBytes(require("crypto").randomInt(16, 48))
        .toString("base64")
        .replace(/[=+\/]/g, "");

      res.setHeader(
        "Content-Security-Policy",
        `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://cdnjs.cloudflare.com; style-src 'self' 'nonce-${nonce}' https://cdnjs.cloudflare.com; img-src 'self' data:;`
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
      res.setHeader("X-Powered-By", "Enhanced Log Manager");

      // Authorization check
      if (config.authEnabled) {
        const clientIP = req.socket.remoteAddress;

        if (!config.allowedIPs.includes(clientIP)) {
          res.writeHead(403, { "Content-Type": "text/plain" });
          res.end("Access denied: Your IP is not authorized.");
          return;
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

    server.listen(config.serverPort, () => {
      console.log(
        `Log Viewer running at http://localhost:${config.serverPort}`
      );
    });
  }

  // ====== Helper Functions for Web UI ======
  function filterLogs(level, search, startDate, endDate) {
    let logs = [];

    // If we have logs in memory, use those
    if (logBuffer.length > 0) {
      logs = [...logBuffer];
    }
    // Otherwise read from file
    else if (
      fs.existsSync(path.join(config.logDir, config.logFile.split("/").pop()))
    ) {
      try {
        const content = fs.readFileSync(
          path.join(config.logDir, config.logFile.split("/").pop()),
          "utf8"
        );

        logs = content
          .split("\n")
          .filter((line) => line.trim() !== "")
          .map((line) => {
            // Parse timestamp and level from log line
            const timestampMatch = line.match(/\[(.*?)\]/);
            const levelMatch = line.match(/\[(INFO|WARN|ERROR|DEBUG)\]/i);

            return {
              formattedMessage: line,
              timestamp: timestampMatch ? timestampMatch[1] : "",
              level: levelMatch ? levelMatch[1].toLowerCase() : "",
              message: line,
            };
          });
      } catch (err) {
        console.error("Error reading log file for filtering:", err);
        return [];
      }
    }

    // Apply filters
    return logs.filter((log) => {
      let include = true;

      if (level && log.level !== level.toLowerCase()) {
        include = false;
      }

      if (search && !log.message.toLowerCase().includes(search.toLowerCase())) {
        include = false;
      }

      if (startDate) {
        const logDate = new Date(log.timestamp);
        const filterDate = new Date(startDate);
        if (logDate < filterDate) {
          include = false;
        }
      }

      if (endDate) {
        const logDate = new Date(log.timestamp);
        const filterDate = new Date(endDate);
        if (logDate > filterDate) {
          include = false;
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
    return await ejs.renderFile("webpage.ejs", {
      nonce,
      config,
    });
  }

  // ====== Public Interface ======
  if (config.startWebServer) {
    startServer();
  }

  // Create log methods for each defined level
  const logMethods = {};

  config.levels.forEach((level) => {
    logMethods[level] = (...args) => log(level, ...args);
  });

  // Public interface
  return {
    // Core logging methods
    log,
    ...logMethods,

    // Server control
    startServer,

    // Configuration methods
    getConfig: () => ({ ...config }),
    updateConfig: (newConfig) => {
      Object.assign(config, newConfig);
      return { ...config };
    },

    // Metrics
    getMetrics: () => (config.enableMetrics ? { ...metrics } : null),

    // Events
    on: (event, callback) => {
      logEmitter.on(event, callback);
    },
    off: (event, callback) => {
      logEmitter.off(event, callback);
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
}

module.exports = createLogManager;
