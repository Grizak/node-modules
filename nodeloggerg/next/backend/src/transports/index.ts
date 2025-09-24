export default {
  ConsoleTransport: (await import("./console")).ConsoleTransport,
  FileTransport: (await import("./file")).FileTransport,
  HttpTransport: (await import("./http")).HttpTransport,
};
