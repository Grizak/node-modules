const path = require("path");
const fs = require("fs");
const http = require("http");

class LogManager {
  constructor(options = {}) {
    this.logFile = options.logFile || path.join(process.cwd(), "logs.txt");
    this.levels = options.levels || ["info", "warn", "error", "debug"];
    this.consoleOnly = options.consoleOnly;
    this.fileOnly = options.fileOnly;
    this.serverPort = options.serverPort | 9001;
    this.startWebServer = options.startWebServer | false;

    if (this.startWebServer) {
      this.startServer();
    }
  }

  formatTimestamp() {
    const isoString = new Date().toISOString(); // e.g., 2024-12-21T11:10:23.061Z
    const [date, time] = isoString.split("T"); // Split into date and time
    const formattedTime = time.slice(0, 8); // Remove milliseconds and 'Z'

    return `${date} ${formattedTime}`; // e.g., 2024-12-21 11:10:23
  }

  log(level, message) {
    if (!this.levels.includes(level)) {
      throw new Error(`Invalid log level: ${level}`);
    }

    const timestamp = this.formatTimestamp();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;

    if (this.consoleOnly) {
      return console.log(formattedMessage);
    }

    if (this.fileOnly) {
      return fs.appendFileSync(this.logFile, formattedMessage + "\n", "utf8");
    }

    console.log(formattedMessage);
    fs.appendFileSync(this.logFile, formattedMessage + "\n", "utf8");
  }

  info(message) {
    this.log("info", message);
  }

  warn(message) {
    this.log("warn", message);
  }

  error(message) {
    this.log("error", message);
  }

  debug(message) {
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
                    }, 1000); // Refresh logs every second
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
