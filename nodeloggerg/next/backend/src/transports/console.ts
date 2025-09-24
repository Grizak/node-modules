import type { Transport, FormattedLog } from "../types";

export class ConsoleTransport implements Transport {
  constructor() {}

  log(log: FormattedLog) {
    console.log(log.formattedMessage);
  }
}
