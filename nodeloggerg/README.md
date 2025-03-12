# NodeLoggerg

A simple logging manager for Node.js that helps manage logging for your application. It writes logs to both the console and a log file. You can configure log levels, log formatting, and even set up a web server to view logs in real-time.

## Features

- **Log Levels**: Supports multiple log levels (`info`, `warn`, `error`, `debug` or custom ones you specify).
- **Timestamped Logs**: Automatically adds timestamps to your log messages.
- **Customizable Log Format**: Define your own log format to fit your needs.
- **File Output**: Logs are written to a file (default location is `logs.txt`), with optional log rotation.
- **Console Output**: Logs are also output to the console (can be disabled).
- **Web-Based Log Viewer**: View logs in real-time via a built-in web server, with optional security features.
- **Authentication and IP Whitelisting**: Secure your log viewer with basic authentication or IP restrictions.

## Installation

You can install this package via npm:

```bash
npm install nodeloggerg
```

Or clone the repository and use it directly in the project:

```bash
git clone https://github.com/Grizak/node_modules.git
mv node_modules/nodeloggerg nodeloggerg
rm -rf node_modules
cd nodeloggerg
npm install
```

## Usage

### Basic Example

```javascript
const LogManager = require("nodeloggerg"); // Or use the local path if you cloned the repo

// Create a new LogManager instance
const logger = new LogManager();

// Log messages with different levels
logger.info("Server started");
logger.warn("This is a warning");
logger.error("An error occurred");
logger.debug("Debugging information");
```

### Custom Log File Path

You can specify a custom log file path and log levels when creating a log instance:

```javascript
const logger = new LogManager({
  logFile: "path/to/custom-log-file.log", // Specify a custom log file path
  levels: ["info", "warn", "error"], // Only log the specified levels
});

logger.info("Server started");
logger.error("An error occurred");
```

### Customize Log Format

Define your own format for log messages using the `logFormat` option:

```javascript
const logger = new LogManager({
  logFormat: (level, timestamp, message) => `${timestamp} | ${level.toUpperCase()} > ${message}`
});

logger.info("Server started");
// Output: 2025-03-12 14:00:00 | INFO > Server started
```

### Log Rotation (Automatic)

Logs are automatically rotated when the file size exceeds 5 MB. The old file is archived with a timestamp.

### Output Options

You can choose where the logs are written or printed:

```javascript
const logger1 = new LogManager({
  consoleOnly: true, // Logs are only printed in the console
});

const logger2 = new LogManager({
  fileOnly: true, // Logs are only written to the log file
});

const logger3 = new LogManager({
  // Logs are printed in the console and written to the log file
});
```

### Web-Based Log Viewer

The module comes with a real-time log viewer accessible via a web browser:

```javascript
const logger = new LogManager({
  startWebServer: true, // Enables the web server for logs
});

const loggerWithPort = new LogManager({
  startWebServer: true,
  serverPort: 9001, // Specify the server port
});
```

### Securing the Web Server

To secure the log viewer, use basic authentication or IP whitelisting:

```javascript
const logger = new LogManager({
  startWebServer: true,
  username: "secureUser", // Sets the username for basic authentication
  password: "strongPassword123", // Sets the password for basic authentication
  allowedIPs: ["127.0.0.1", "192.168.1.100"], // Restrict access to these IPs
});
```

### Configuration Options

| Option           | Type                            | Default                              | Description                                                 |
| ----------------- | ------------------------------- | ------------------------------------ | ----------------------------------------------------------- |
| `logFile`        | `string`                        | `logs.txt`                           | The path where the log file will be written.                |
| `levels`         | `Array<string>`                 | `["info", "warn", "error", "debug"]` | The log levels to include.                                  |
| `consoleOnly`    | `boolean`                       | `false`                              | Logs are printed only in the console.                       |
| `fileOnly`       | `boolean`                       | `false`                              | Logs are written only to the log file.                      |
| `startWebServer` | `boolean`                       | `false`                              | Starts the web-based log viewer.                            |
| `serverPort`     | `number`                        | `9001`                               | Port for the web server.                                     |
| `logFormat`      | `function(level, timestamp, message): string` | Default format                     | Customize the log message format.                           |
| `username`       | `string`                        | `admin`                              | Username for web server authentication.                     |
| `password`       | `string`                        | `password`                           | Password for web server authentication.                     |
| `allowedIPs`     | `Array<string>`                 | `["127.0.0.1"]`                      | Whitelist of allowed IPs for accessing the web server.       |

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.
