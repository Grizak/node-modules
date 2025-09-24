import { FormattedLog, Transport } from "../types";
import fs from "fs";
import path from "path";

export class FileTransport implements Transport {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  log: (log: FormattedLog) => void = (log) => {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.appendFileSync(this.filePath, log.formattedMessage + "\n");
  };
}
