import { HTTPOptions, LogManagerConfig } from "../types";
import { FileTransport } from "./file";

export class HttpTransport {
  private filePath: string;
  port: number;

  constructor(options: HTTPOptions) {
    this.filePath = options.file;
    this.port = options.port || 3000;
  }

  setup(config: LogManagerConfig) {
    config.transports.forEach((transport) => {
      if (transport instanceof FileTransport) {
        return;
      }
    });
    throw new Error("HttpTransport requires FileTransport to be configured");
  }
}
