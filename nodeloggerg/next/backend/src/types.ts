export interface FormattedLog extends Log {
  formattedMessage: string;
}

export interface Log {
  level: "info" | "warn" | "error" | "debug";
  message: string;
  timestamp: Date;
}

export interface Transport {
  log: (log: FormattedLog) => any | Promise<any>;
  setup?: (config: LogManagerConfig) => any | Promise<any>;
  exports?: any;
}

export interface LogManagerOptions {
  transports?: Transport[];
  formatMessage?: (log: Log) => string;
}

export interface LogManagerConfig {
  transports: Transport[];
  formatMessage: (log: Log) => string;
}

export interface LogManagerReturn {
  info: (message: string) => Log;
  warn: (message: string) => Log;
  error: (message: string) => Log;
  debug: (message: string) => Log;
  log: (level: Log["level"], message: string) => Log;
  getConfig: () => LogManagerConfig;
  transports: any;
}

export interface HTTPOptions {
  file: string;
  port?: number;
}
