const path = require("path");
const fs = require("fs");
const http = require("http");

/**
 * @typedef {Object} LogManagerOptions
 * @property {string} [logFile] - The path to the log file.
 * @property {Array<string>} [levels] - An array of log levels (e.g., "info", "warn", "error", "debug").
 * @property {boolean} [consoleOnly] - If true, logs will only appear in the console.
 * @property {boolean} [fileOnly] - If true, logs will only be written to a file.
 * @property {number} [serverPort] - The port on which the log viewer server will run.
 * @property {boolean} [startWebServer] - If true, starts a web server to view logs.
 * @property {function(string, string, string): string} [logFormat] - A custom function to format log messages. It receives the log level, timestamp, and message as arguments and returns the formatted log string.
 * @property {string} [username] - The username required for basic authentication when accessing the web server. Defaults to "admin".
 * @property {string} [password] - The password required for basic authentication when accessing the web server. Defaults to "admin".
 * @property {Array<string>} [allowedIPs] - An array of allowed IP addresses for accessing the web server. If not specified, defaults to only "127.0.0.1" (localhost).
 */

/**
 * LogManager class to handle logging and log viewing.
 * @class
 */
class LogManager {
  /**
   * Creates a new LogManager instance.
   * 
   * @param {LogManagerOptions} [options={}] - Options to configure the LogManager.
   * 
   * ### Example - Basic Authentication
   * ```javascript
   * const logger = new LogManager({
   *   startWebServer: true,
   *   username: "secureUser", // Default "admin"
   *   password: "strongPassword123" // Default "admin"
   * });
   * ```
   * 
   * ### Example - IP Whitelisting
   * ```javascript
   * const logger = new LogManager({
   *   startWebServer: true,
   *   allowedIPs: ["127.0.0.1", "192.168.1.100"]
   * });
   * ```
   */

  constructor(options = {}) {
    this.logFile = options.logFile || path.join(process.cwd(), "logs.txt");
    this.levels = options.levels || ["info", "warn", "error", "debug"];
    this.consoleOnly = options.consoleOnly || false;
    this.fileOnly = options.fileOnly || false;
    this.serverPort = options.serverPort || 9001;
    this.startWebServer = options.startWebServer || false;
    this.logFormat = options.logFormat || ((level, timestamp, message) => `[${timestamp}] [${level.toUpperCase()}]: ${message}`);
    this.username = options.username || "admin";
    this.password = options.password || "admin";
    this.allowedIPs = options.allowedIPs || ["127.0.0.1"]

    // Validate that both consoleOnly and fileOnly are not set to true at the same time
    if (this.consoleOnly && this.fileOnly) {
      throw new Error("Cannot have both consoleOnly and fileOnly set to true.");
    }

    if (this.startWebServer) {
      this.startServer();
    }
  }

  formatTimestamp() {
    const isoString = new Date().toISOString();
    const [date, time] = isoString.split("T");
    const formattedTime = time.slice(0, 8);
    return `${date} ${formattedTime}`;
  }

  async log(level, message) {
    if (!this.levels.includes(level)) {
      throw new Error(`Invalid log level: ${level}`);
    }

    const timestamp = this.formatTimestamp();
    const formattedMessage = this.logFormat(level, timestamp, message);

    if (this.consoleOnly) {
      console.log(formattedMessage);
    } else {
      if (!this.fileOnly) console.log(formattedMessage);
      await this.printFile(formattedMessage)
  }

  async printFile(message) {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    try {
        if (fs.existsSync(this.logFile)) {
            const stats = await fs.promises.stat(this.logFile);
            if (stats.size >= MAX_FILE_SIZE) {
                const archiveFile = this.logFile.replace('.txt', `_${this.formatTimestamp().replace(/:/g, "-")}.txt`);
                await fs.promises.rename(this.logFile, archiveFile);
            }
        }
        await fs.promises.appendFile(this.logFile, message + "\n", "utf8");
    } catch (err) {
        console.error("Error while handling log file:", err);
    }
  }

  
  info(...args) {
  const message = args.map(arg => {
    if (arg instanceof Error) {
      return `${arg.message} \n${arg.stack}`;
    } else if (typeof arg === 'object') {
      return JSON.stringify(arg, Object.getOwnPropertyNames(arg)); // Include all properties of error objects
    }
    return arg;
  }).join(' ');
  this.log("info", message);
}

warn(...args) {
  const message = args.map(arg => {
    if (arg instanceof Error) {
      return `${arg.message} \n${arg.stack}`;
    } else if (typeof arg === 'object') {
      return JSON.stringify(arg, Object.getOwnPropertyNames(arg)); 
    }
    return arg;
  }).join(' ');
  this.log("warn", message);
}

error(...args) {
  const message = args.map(arg => {
    if (arg instanceof Error) {
      return `${arg.message} \n${arg.stack}`;
    } else if (typeof arg === 'object') {
      return JSON.stringify(arg, Object.getOwnPropertyNames(arg)); 
    }
    return arg;
  }).join(' ');
  this.log("error", message);
}

debug(...args) {
  const message = args.map(arg => {
    if (arg instanceof Error) {
      return `${arg.message} \n${arg.stack}`;
    } else if (typeof arg === 'object') {
      return JSON.stringify(arg, Object.getOwnPropertyNames(arg)); 
    }
    return arg;
  }).join(' ');
  this.log("debug", message);
}


  startServer() {
    const server = http.createServer((req, res) => {
      const clientIP = req.socket.remoteAddress;

      if (!this.allowedIPs.includes(clientIP)) {
          res.writeHead(403, { "Content-Type": "text/plain" });
          res.end("Access denied: Your IP is not authorized.");
          return;
      }
      
      const auth = req.headers['authorization'];

        // Check if Authorization header is missing
        if (!auth || auth.indexOf('Basic ') === -1) {
            res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Secure Area"' });
            res.end('Authorization required.');
            return;
        }

        // Decode Base64 credentials
        const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString('utf8');
        const [user, pass] = credentials.split(':');

        // Validate credentials
        if (user !== this.username || pass !== this.password) {
            res.writeHead(403, { "Content-Type": "text/plain" });
            res.end("Access denied.");
            return;
        }
      
      if (req.url === "/") {
        res.writeHead(200, { "Content-Type": "text/html" });
        const html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Log Viewer</title>
              <style>
                  body { font-family: Arial, sans-serif; padding: 20px; }
                  pre { background: #f4f4f4; padding: 10px; border: 1px solid #ddd; overflow: auto; }
              </style>
          </head>
          <body>
              <h1>Log Viewer</h1>
              <pre id="logs"></pre>
              <script>
                  setInterval(() => {
                      fetch('/logs')
                          .then(response => response.text())
                          .then(data => {
                              document.getElementById('logs').textContent = data;
                          });
                  }, 1000);
              </script>
          </body>
          </html>`;
        res.end(html);
      } else if (req.url === "/logs") {
        res.writeHead(200, { "Content-Type": "text/plain" });
    
        if (fs.existsSync(this.logFile)) {
            // Stream the log file to the response
            const logStream = fs.createReadStream(this.logFile, { encoding: "utf8" });
            logStream.pipe(res);
    
            // Handle any streaming errors gracefully
            logStream.on("error", (err) => {
                console.error("Error reading log file:", err);
                res.end("Error reading log file");
            });
          } else {
            // If the log file doesn't exist, respond with a placeholder message
            res.end("No logs yet!");
          }
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      }
    });

    server.listen(this.serverPort, () => {
      console.log(`Log Viewer running at http://localhost:${this.serverPort}`);
    });
  }
}

module.exports = LogManager;
