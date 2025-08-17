import {
  Schema,
  SchemaDefinition,
  Connection,
  Model,
  Document,
} from "mongoose";
import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { EventEmitter } from "events";

declare module "nodeloggerg" {
  // ====== Core Type Definitions ======

  /**
   * SMTP Configuration options for Nodemailer
   */
  export interface SMTPConfig {
    /** The hostname or IP address of the SMTP server to connect to */
    host: string;
    /** The port to connect to (defaults to 587 if secure is false, 465 if secure is true) */
    port?: number;
    /** If true, the connection will use TLS when connecting */
    secure?: boolean;

    /** Authentication credentials */
    auth?: {
      /** Username for authentication (usually the email address) */
      user?: string;
      /** Password for authentication */
      pass?: string;
      /** Authentication type */
      type?: "login" | "oauth2" | string;
    };

    /** OAuth2 configuration (required if auth.type is 'oauth2') */
    oauth2?: {
      /** User email address */
      user?: string;
      /** OAuth Client ID */
      clientId?: string;
      /** OAuth Client Secret */
      clientSecret?: string;
      /** OAuth Refresh Token */
      refreshToken?: string;
      /** OAuth Access Token */
      accessToken?: string;
      /** Access token expiration timestamp in milliseconds */
      expires?: number;
    };

    /** If true, creates a connection pool */
    pool?: boolean;
    /** Maximum number of connections to pool */
    maxConnections?: number;
    /** Maximum number of messages to send using a single connection */
    maxMessages?: number;

    /** Additional TLS options */
    tls?: {
      /** Reject self-signed or invalid TLS certificates */
      rejectUnauthorized?: boolean;
      [key: string]: any;
    };

    /** Connection timeout in milliseconds */
    connectionTimeout?: number;
    /** How long to wait for the greeting after connection */
    greetingTimeout?: number;
    /** How long to wait for socket operations */
    socketTimeout?: number;

    /** Local interface to bind to for network connections */
    localAddress?: string;
    /** Hostname to be used for identifying to the server */
    name?: string;
    /** If true, does not try to use STARTTLS even if available */
    ignoreTLS?: boolean;
    /** If true, forces the use of STARTTLS even if not advertised */
    requireTLS?: boolean;
    /** If true, uses STARTTLS when available */
    opportunisticTLS?: boolean;

    /** Logger instance */
    logger?: any;
    /** If true, outputs debug information to console */
    debug?: boolean;
    /** Function to be called with mail envelope and delivery info */
    transactionLog?: (envelope: any, info: any) => void;

    /** Proxy URL configuration object */
    proxy?: {
      /** Hostname of the proxy server */
      host?: string;
      /** Port of the proxy server */
      port?: number;
      /** Proxy authentication as 'user:pass' */
      auth?: string;
    };

    /** DSN parameters for requesting delivery status notification */
    dsn?: {
      /** Return either the full message ('FULL') or only headers ('HDRS') */
      ret?: "FULL" | "HDRS";
    };

    /** DKIM signing options */
    dkim?: {
      [key: string]: any;
    };
  }

  /**
   * Authentication configuration
   */
  export interface Auth {
    /** Username to log in */
    user?: string;
    /** Password to log in */
    pass?: string;
  }

  /**
   * Email alert configuration
   */
  export interface EmailAlert {
    /** The level to look for when sending emails */
    level: string;
    /** SMTP config for nodemailer */
    smtp: SMTPConfig;
    /** Who to send the emails from */
    from: string;
    /** Whom to send the emails to */
    to: string;
    /** Subject to include in the emails */
    subject?: string;
    /** Optional pattern to match in log message */
    pattern?: string;
  }

  /**
   * Server configuration options
   */
  export interface ServerConfig {
    /** Whether to enable search functionality in the web interface */
    enableSearch?: boolean;
    /** Whether to enable chart visualizations in the web interface */
    enableCharts?: boolean;
    /** Auth for the web server */
    auth?: Auth;
    /** An array of allowed IP addresses for accessing the web server */
    allowedIPs?: string[];
    /** Whether to require authentication when accessing the web server */
    authEnabled?: boolean;
    /** The port on which the log viewer server will run */
    serverPort?: number;
    /** If true, starts a web server to view logs */
    startWebServer?: boolean;
    /** If true, enables real-time updates via Socket.IO */
    enableRealtime?: boolean;
  }

  /**
   * Database configuration
   */
  export interface DbConfig {
    /** The database type. Accepted types are "mongodb" and "sql" */
    type: "mongodb" | "sql";
    /** MongoDB specific configuration */
    mongodb?: {
      /** What the database collection should be called */
      collectionName?: string;
      /** The database schema (For mongodb) */
      schema?: SchemaDefinition;
      /** The uri for mongodb to connect to */
      uri?: string;
    };
  }

  /**
   * Log manager configuration options
   */
  export interface LogManagerOptions {
    /** The path to the log file */
    logFile?: string;
    /** An array of log levels */
    levels?: string[];
    /** If true, logs will only appear in the console */
    consoleOnly?: boolean;
    /** If true, logs will only be written to a file */
    fileOnly?: boolean;
    /** A custom function to format log messages */
    logFormat?: (level: string, timestamp: string, message: string) => string;
    /** Whether to compress old log files when rotating */
    compressOldLogs?: boolean;
    /** Whether to track logging metrics */
    enableMetrics?: boolean;
    /** Configuration for email alerts */
    emailAlerts?: EmailAlert[];
    /** Database configuration for log persistence */
    dbConfig?: DbConfig;
    /** Directory for storing multiple log files */
    logDir?: string;
    /** Config for the web server */
    serverConfig?: ServerConfig;
    /** The default log level that the `log` function uses */
    logLevel?: string;
  }

  /**
   * Individual log entry object
   */
  export interface LogEntry {
    /** The log level */
    level: string;
    /** ISO timestamp when log was created */
    timestamp: string;
    /** The raw log message */
    message: string;
    /** The formatted log message as it appears in files/console */
    formattedMessage: string;
  }

  /**
   * Log file information object
   */
  export interface LogFileInfo {
    /** The filename */
    name: string;
    /** Full path to the file */
    path: string;
    /** File size in bytes */
    size: number;
    /** File creation date */
    created: Date;
  }

  /**
   * Logging metrics object
   */
  export interface LogMetrics {
    /** Total number of logs recorded */
    totalLogs: number;
    /** Count of logs by level */
    logsByLevel: Record<string, number>;
    /** Logs per minute history */
    logsPerMinute: Array<{
      timestamp: string;
      count: number;
    }>;
    /** Number of errors in current minute */
    errorsPerMinute: number;
    /** Timestamp of last minute boundary */
    lastMinuteTimestamp: number;
  }

  /**
   * Event subscription return object
   */
  export interface EventSubscription {
    /** Remove the event listener */
    remove: () => void;
  }

  /**
   * Log manager instance with extensive logging capabilities and web interface
   */
  export interface LogManager {
    // ====== Core Logging Methods ======

    /** Core logging function that accepts a level and any number of arguments */
    log(level: string, ...args: any[]): Promise<LogEntry>;

    // Dynamic log level methods (these are generated based on config.levels)
    // Common ones are included here, but actual methods depend on configuration
    info?(...args: any[]): Promise<LogEntry>;
    warn?(...args: any[]): Promise<LogEntry>;
    error?(...args: any[]): Promise<LogEntry>;
    debug?(...args: any[]): Promise<LogEntry>;

    // ====== Server Control ======

    /** Start the web server for viewing logs */
    startServer(): Promise<void>;

    // ====== Configuration Methods ======

    /** Get the current configuration object */
    getConfig(): LogManagerOptions;

    /** Update configuration with new values and return merged config */
    updateConfig(newConfig: Partial<LogManagerOptions>): void;

    /** Regenerate the log methods based on current levels */
    regeneragteLogMethods(): string[];

    /** Get all available log levels to use */
    getAvailableLevels(): string[];

    // ====== Metrics ======

    /** Get logging metrics (returns null if metrics disabled) */
    getMetrics(): LogMetrics | null;

    // ====== Event System ======

    /** Subscribe to log events, returns object with remove method */
    on(event: string, callback: (...args: any[]) => void): EventSubscription;

    /** Unsubscribe from log events */
    off(event: string, callback: (...args: any[]) => void): void;

    // ====== Socket.IO Methods ======

    /** Get number of connected Socket.IO clients */
    getConnectedClients(): number;

    /** Broadcast data to all connected clients via Socket.IO */
    broadcastToClients(event: string, data: any): void;

    // ====== Utility Methods ======

    /** Filter logs by level, search term, start date, and end date */
    filterLogs(
      level: string,
      search: string,
      startDate: string,
      endDate: string
    ): LogEntry[];

    /** Export log entries as CSV string */
    exportLogsAsCsv(logs: LogEntry[]): string;

    // ====== File Management ======

    /** Compress a log file using gzip */
    compressLogFile(filePath: string): Promise<string | null>;

    /** Get information about all log files in the log directory */
    getLogFiles(): LogFileInfo[];

    // ====== Advanced Features ======

    /** Create a new log manager instance with custom configuration */
    createCustomLogger(customConfig: Partial<LogManagerOptions>): LogManager;
  }

  // ====== Main Factory Function ======

  /**
   * Create a log manager instance with extensive logging capabilities
   *
   * @param options - Options to configure the LogManager
   * @returns The log manager interface with logging methods and utilities
   */
  function createLogManager(options?: LogManagerOptions): LogManager;

  export = createLogManager;
}

// ====== Global Augmentation for Dynamic Methods ======

declare global {
  namespace LogManagerTypes {
    /**
     * Interface that can be extended to add custom log level methods
     * Usage:
     * ```typescript
     * declare global {
     *   namespace LogManagerTypes {
     *     interface CustomLogMethods {
     *       fatal(...args: any[]): Promise<LogEntry>;
     *       trace(...args: any[]): Promise<LogEntry>;
     *     }
     *   }
     * }
     * ```
     */
    interface CustomLogMethods {}
  }
}

// Extend the LogManager interface with custom methods
declare module "nodeloggerg" {
  interface LogManager extends LogManagerTypes.CustomLogMethods {}
}
