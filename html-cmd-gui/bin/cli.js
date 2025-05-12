#!/usr/bin/env node
// bin/cli.js - Command-line interface for html-cmd-gui

const fs = require("fs");
const path = require("path");
const yargs = require("yargs");
const htmlCmd = require("../html-cmd-gui");

// Parse command line arguments
const argv = yargs
  .usage("Usage: $0 <command> [options]")
  .command("render [file]", "Render an HTML file in the terminal", (yargs) => {
    return yargs.positional("file", {
      describe: "HTML file to render",
      type: "string",
      demandOption: true,
    });
  })
  .option("scripts", {
    alias: "s",
    describe: "JavaScript file with event handlers",
    type: "string",
  })
  .help()
  .alias("help", "h").argv;

// Check if we're rendering a file
if (argv._[0] === "render") {
  // Check if file exists
  const filePath = path.resolve(process.cwd(), argv.file);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  // Load event handlers if provided
  let events = {};
  if (argv.scripts) {
    const scriptsPath = path.resolve(process.cwd(), argv.scripts);
    if (fs.existsSync(scriptsPath)) {
      try {
        events = require(scriptsPath);
      } catch (err) {
        console.error(`Error loading scripts: ${err.message}`);
        process.exit(1);
      }
    } else {
      console.error(`Error: Scripts file not found: ${scriptsPath}`);
      process.exit(1);
    }
  }

  // Render the HTML file
  console.log(`Rendering ${filePath}...`);
  const instance = htmlCmd.render(filePath, { events });

  // Handle exit
  process.on("SIGINT", () => {
    instance.close();
    process.exit();
  });
} else {
  yargs.showHelp();
}
