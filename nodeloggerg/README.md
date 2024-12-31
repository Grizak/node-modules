# NodeLoggerg

A simple logging manager for Node.js that helps manage logging for your application. It writes logs to both the console and a log file. You can easily configure the log levels and the location of the log file.

## Features

- **Log Levels**: Supports different log levels (`info`, `warn`, `error`, `debug` or whatever you specify).
- **Timestamped Logs**: Automatically adds timestamps to your log messages.
- **File Output**: Logs are written to a file (default location is `logs.txt`).
- **Console Output**: Logs are also output to the console (can be disabled).
- **Customizable Log File Location**: The location of the log file can be configured.

## Installation

You can install this package via npm:

```bash
npm install nodeloggerg
```
Alternately, you can clone the repository and use it directly in the project

```bash
git clone https://github.com/Grizak/nodeloggerg.git
cd nodeloggerg
npm install
```

## Usage

### Basic example

```javascript
const logManager = require('nodeloggerg'); // Or use the local path if you cloned the repo

// Create a new LogManager instance
const logger = new logManager();

// Log messages with different levels
logger.info("Server started");
logger.warn("This is a warning");
logger.error("An error occurred");
logger.debug("Debugging information");
```

### Custom log file path

You can specify a custom log file path and log levels when creating a log instance

```javascript
const logger = new logManager({
    logFile: 'path/to/custom-log-file.log', // Specify a custom log file path
    levels: ['info', 'warn', 'error'] // Only log the specified levels
});

logger.info("Server started");
logger.error("An error occurred");
```

### Choose what type of output you want

You can choose where you want the output to be printed/written

```javascript
const logger = new logManager({
    consoleOnly: true, // Sets the program to only print the log in the console
});

const logger = new logManager({
    fileOnly: true, // Sets the program to only write the changes to the logFile
});

const logger = new logManager({
    // Leave empty if you want both
});
```

### Web Server

The module also has a web server now, that you can start like this:

``` javascript
const logger = new logManager({
    startWebServer: true, // This will start the web server
});

const logger = new logManager({
    startWebServer: true,
    serverPort: 9001, // Sets the port that the server will run on
})
```

This will start a web server on default port `9001`

### Configuraton options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `logFile` | `string` | `logs.txt` | The path where the log file will be written. |
| `levels` | `Array` | `['Info', 'warn', 'error', 'debug']` | The log levels to include in the logs. |
| `consoleOnly` | `Boolean` | `undefined` | Choose if the logs should only be printed in the console. |
| `fileOnly` | `Boolean` | `undefined` | Choose if the logs should only be written to the `logFile`. |
| `startWebServer` | `Boolean` | `false` | Choose whether the web server should start or not |
| `serverPort` | `Number` | `9001` | Choose what port the web server should run on |

### Licence

This project is licensed under the MIT Licence - see the `LICENCE` file for details
