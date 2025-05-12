// html-cmd-gui.js - Main entry point

const fs = require("fs");
const path = require("path");
const { parse } = require("./lib/parser");
const { render } = require("./lib/renderer");
const { setupEventHandlers } = require("./lib/events");

/**
 * Main function to render HTML content to the terminal
 * @param {string} htmlContent - HTML string or file path
 * @param {object} options - Configuration options
 */
function renderHTML(htmlContent, options = {}) {
  // Detect if htmlContent is a file path
  if (htmlContent.trim().indexOf("<") !== 0 && fs.existsSync(htmlContent)) {
    htmlContent = fs.readFileSync(htmlContent, "utf8");
  }

  // Parse HTML to DOM-like structure
  const domTree = parse(htmlContent);

  // Initial render
  render(domTree);

  // Set up event handlers if provided
  if (options.events) {
    setupEventHandlers(domTree, options.events);
  }

  return {
    update: (newHtml) => {
      const newDomTree = parse(newHtml);
      render(newDomTree);
    },
    close: () => {
      // Clean up terminal state
      process.stdout.write("\x1b[?25h"); // Show cursor
      console.log("\n\nHTML-CMD-GUI session ended");
    },
  };
}

module.exports = { render: renderHTML };

// Example usage
// const htmlCmd = require('./html-cmd-gui');
//
// htmlCmd.render(`
//   <div class="container">
//     <h1>Hello Terminal!</h1>
//     <p>This is a terminal UI generated from HTML.</p>
//
//     <div class="box">
//       <h2>Login Form</h2>
//       <input type="text" id="username" placeholder="Username" />
//       <input type="password" id="password" placeholder="Password" />
//       <button id="loginBtn">Login</button>
//     </div>
//   </div>
// `, {
//   events: {
//     '#loginBtn': {
//       click: () => console.log('Login button clicked!')
//     }
//   }
// });
