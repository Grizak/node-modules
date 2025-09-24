# Nodeloggerg

A powerful, flexible, and feature-rich logging system for Node.js applications with advanced filtering, web interface, and metrics tracking capabilities.

## Features

- **Multi-level Logging**: Supports configurable log levels (info, warn, error, debug)
- **Output Flexibility**: Write to console, file, or both
- **Web Interface**: Built-in web server to view, search, and download logs
- **Log Rotation**: Automatic log file rotation based on size limits
- **Compression**: Compress rotated log files to save disk space
- **Security**: IP filtering and basic authentication for the web interface
- **Metrics**: Track and visualize logging statistics (optional)
- **Email Alerts**: Send notifications for critical logs (configurable)
- **Search & Filtering**: Filter logs by level, text search, and date ranges
- **Export Options**: Export logs as JSON or CSV
- **Event System**: Subscribe to log events programmatically
- **Custom Formatting**: Define your own log message format
- **Extensibility**: Create multiple logger instances with different configurations

## Installation

```bash
npm install nodeloggerg
```

## Basic Usage

```javascript
const createLogManager = require("nodeloggerg");

// Create a basic logger
const logger = createLogManager();

// Log at different levels
logger.info("Application started");
logger.debug("Debug information");
logger.warn("Warning message");
logger.error("An error occurred", new Error("Something went wrong"));

// Create structured logs
logger.info({ user: "john", action: "login", status: "success" });
```

## Configuration Options

```javascript
const logger = createLogManager({
  // Log file path
  logFile: "app-logs.txt",

  // Available log levels
  levels: ["info", "warn", "error", "debug", "trace"],

  // Output options
  consoleOnly: false, // Log to console only
  fileOnly: false, // Log to file only



  // Web interface options
  serverOptions: {
    serverPort: 9001,
    startWebServer: true,

    // Security options
    allowedIPs: ["127.0.0.1", "::1"],
    authEnabled: true,
    auth: {
      user: "admin",
      pass: "securepassword",
    }

    // Web interface feature options
    enableSearch: true,
    enableCharts: true,
    enableRealtime: true,
  }

  // Format logs
  logFormat: (level, timestamp, message) =>
    `[${timestamp}] [${level.toUpperCase()}]: ${message}`,

  // Advanced options
  compressOldLogs: true,
  enableMetrics: true,

  // Email alerts
  emailAlerts: [
    {
      level: "error",
      pattern: "Database connection",
      smtp: {
        host: "smtp.example.com",
        port: 587,
        secure: false,
        auth: {
          user: "alerts@example.com",
          pass: "password",
        },
      },
      from: "alerts@example.com",
      to: "admin@example.com",
      subject: "Critical Database Error",
    },
  ],

  // Directory for log files
  logDir: "./logs"
});
```

## Web Interface

The built-in web interface provides a user-friendly way to view, filter, and download logs. To start the web server:

```javascript
// Start web server when creating the logger
const logger = createLogManager({
  startWebServer: true,
  serverPort: 9001,
});

// Or start it later
logger.startServer();
```

Once started, navigate to `http://localhost:9001` to access the log viewer interface.

### Web Interface Features

- View logs in real-time with auto-refresh
- Filter logs by level, text search, and date range
- Download log files in various formats (text, JSON, CSV)
- View logging metrics and charts (when metrics are enabled)
- Browse and download archived log files

## Advanced Usage

### Custom Logger

```javascript
// Create a specialized logger for database operations
const dbLogger = logger.createCustomLogger({
  logFile: "database.log",
  levels: ["info", "error"],
  logFormat: (level, timestamp, message) => {
    return `[DB][${timestamp}] ${level}: ${message}`;
  },
});

dbLogger.info("Database connection established");
```

### Event Subscription

```javascript
// React to error logs
logger.on("log", (logEntry) => {
  if (logEntry.level === "error") {
    // Perform additional actions for errors
    notifyAdministrator(logEntry);
  }
});
```

### Log Filtering

```javascript
// Get logs programmatically with filters
const errorLogs = logger.filterLogs(
  "error",
  "database",
  "2023-01-01",
  "2023-01-31"
);
```

### Export Logs

```javascript
// Export filtered logs as CSV
const csvData = logger.exportLogsAsCsv(
  logger.filterLogs("error", "database", "2023-01-01", "2023-01-31")
);
fs.writeFileSync("database-errors.csv", csvData);
```

## Web Template

The module comes with a built-in web template (`webpage.ejs`) that provides a responsive, feature-rich interface for viewing logs. The template includes:

- Tabbed interface (Logs, Files, Metrics)
- Filtering and search capabilities
- Log syntax highlighting
- Real-time updates
- Metrics visualization with charts
- File download options

## Requirements

- Node.js 12.0.0 or higher
- Dependencies:
  - nodemailer (for email alerts)
  - ejs (for web template rendering)
  - socket.io (for realtime comunication between server and webinterface)

## License

MIT
