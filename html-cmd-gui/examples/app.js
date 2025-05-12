// Example node.js application usage
// save as examples/app.js

const htmlCmd = require("../html-cmd-gui");
const fs = require("fs");
const path = require("path");

// Load HTML file
const htmlPath = path.join(__dirname, "login-form.html");
const htmlContent = fs.readFileSync(htmlPath, "utf8");

// Define event handlers
const events = {
  "#loginBtn": {
    click: () => {
      console.log("\n\nLogin button clicked!");

      // Get input values (in a real implementation)
      // const username = document.getElementById('username').value;
      // const password = document.getElementById('password').value;

      console.log("Simulating login...");
      setTimeout(() => {
        console.log("Login successful!");
      }, 1000);
    },
  },
  "#cancelBtn": {
    click: () => {
      console.log("\n\nCancel button clicked!");
      process.exit(0);
    },
  },
};

// Render the HTML
const app = htmlCmd.render(htmlContent, { events });

// Handle Ctrl+C to exit gracefully
process.on("SIGINT", () => {
  app.close();
  process.exit();
});

console.log("Application running. Press Ctrl+C to exit.");
