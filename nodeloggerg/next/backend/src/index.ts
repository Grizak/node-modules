import type {
  FormattedLog,
  Log,
  LogManagerConfig,
  LogManagerOptions,
  LogManagerReturn,
} from "./types";
import transports from "./transports";

const createLogManager = (options: LogManagerOptions): LogManagerReturn => {
  const config: LogManagerConfig = {
    transports: options.transports || [
      new transports.ConsoleTransport(),
      new transports.FileTransport("logs/logs.txt"),
    ],
    formatMessage:
      options.formatMessage ||
      ((log: Log): string => {
        return `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}]: ${
          log.message
        }`;
      }),
  };

  // Make sure that all transports have a log method and call a setup method if it exists
  config.transports.forEach((transport) => {
    if (typeof transport.log !== "function") {
      throw new Error("Transport is missing log method");
    }
    if ("setup" in transport && typeof transport.setup === "function") {
      transport.setup(config);
    }
  });

  const log = (level: Log["level"], message: string) => {
    const log: FormattedLog = {
      level,
      message,
      timestamp: new Date(),
      formattedMessage: config.formatMessage({
        level,
        message,
        timestamp: new Date(),
      }),
    };

    config.transports.forEach((transport) => {
      transport.log(log);
    });

    return log;
  };

  const transportExports = config.transports.reduce<Record<string, unknown>>(
    (acc, transport) => {
      if ("exports" in transport && transport.exports) {
        acc[transport.constructor.name] =
          typeof transport.exports === "function"
            ? transport.exports()
            : transport.exports;
      }
      return acc;
    },
    {}
  );

  return {
    log,
    info: (message) => log("info", message),
    warn: (message) => log("warn", message),
    error: (message) => log("error", message),
    debug: (message) => log("debug", message),
    getConfig: () => config,
    transports: transportExports,
  };
};

export default createLogManager;

export type * from "./types";
export * from "./transports";
