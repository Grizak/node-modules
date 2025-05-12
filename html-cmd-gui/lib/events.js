// lib/events.js - Event handling system

const readline = require("readline");

// Store event handlers
const handlers = new Map();
let isListening = false;

/**
 * Set up event handlers for the rendered DOM
 * @param {object} domTree - Parsed DOM tree
 * @param {object} eventConfig - Event configuration
 */
function setupEventHandlers(domTree, eventConfig) {
  // Clear existing handlers
  handlers.clear();

  // Set up new handlers
  Object.entries(eventConfig).forEach(([selector, events]) => {
    // Currently only support ID selectors
    if (selector.startsWith("#")) {
      const id = selector.substring(1);
      handlers.set(id, events);
    }
  });

  // Start listening for input if not already
  if (!isListening) {
    startInputListener();
  }
}

/**
 * Start listening for terminal input
 */
function startInputListener() {
  isListening = true;

  // Put terminal in raw mode to capture key presses
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  // Set up keypress handler
  process.stdin.on("keypress", (str, key) => {
    // Exit on Ctrl+C
    if (key.ctrl && key.name === "c") {
      process.stdout.write("\x1b[?25h"); // Show cursor
      process.exit();
    }

    // TODO: Handle navigation between elements with arrow keys

    // Handle Enter key for button clicks and form submissions
    if (key.name === "return") {
      // Fire event for focused element
      if (global.focusedElementId && handlers.has(global.focusedElementId)) {
        const elementHandlers = handlers.get(global.focusedElementId);
        if (elementHandlers.click) {
          elementHandlers.click();
        }
      }
    }
  });
}

module.exports = {
  setupEventHandlers,
};
