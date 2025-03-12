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
 */

/**
 * LogManager class to handle logging and log viewing.
 * @class
 */
class LogManager {
  /**
   * @param {LogManagerOptions} [options={}] - Options to configure the LogManager.
   */
  constructor(options = {}) {
    this.logFile = options.logFile || path.join(process.cwd(), "logs.txt");
    this.levels = options.levels || ["info", "warn", "error", "debug"];
    this.consoleOnly = options.consoleOnly || false;
    this.fileOnly = options.fileOnly || false;
    this.serverPort = options.serverPort || 9001;
    this.startWebServer = options.startWebServer || false;

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

  log(level, message) {
    if (!this.levels.includes(level)) {
      throw new Error(`Invalid log level: ${level}`);
    }

    const timestamp = this.formatTimestamp();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;

    if (this.consoleOnly) {
      console.log(formattedMessage);
    } else if (this.fileOnly) {
      this.printFile(formattedMessage);
    } else {
      console.log(formattedMessage);
      this.printFile(formattedMessage);
    }
  }

  printfile(message) {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    if (fs.fileExistsSync(this.logFile) && fs.statSync(this.logFile).size >= MAX_FILE_SIZE) {
      const archiveFile = this.logFile.replace('.txt', `_${Date.now()}.txt`);
     fs.renameSync(this.logFile, archiveFile);
    }
    fs.appendFileSync(this.logFile, message + "\n", "utf8");
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
        const logContent = fs.existsSync(this.logFile)
          ? fs.readFileSync(this.logFile, "utf-8")
          : "No logs yet!";
        res.end(logContent);
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
