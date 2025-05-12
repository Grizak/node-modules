// lib/renderer.js - Terminal rendering engine

const chalk = require("chalk");
const boxen = require("boxen");
const stripAnsi = require("strip-ansi");
const terminalSize = require("term-size");

// Track the current render state
let currentScreen = [];
let focusedElementId = null;
const elements = new Map();

/**
 * Main render function
 * @param {object} domTree - Parsed DOM tree
 */
function render(domTree) {
  const { columns, rows } = terminalSize();

  // Clear screen and prepare
  process.stdout.write("\x1b[2J"); // Clear entire screen
  process.stdout.write("\x1b[0;0H"); // Move cursor to top-left
  process.stdout.write("\x1b[?25l"); // Hide cursor

  // Reset state for new render
  currentScreen = [];
  elements.clear();

  // Render the tree
  renderNode(domTree, 0, 0, columns, {
    x: 0,
    y: 0,
    width: columns,
    height: rows,
  });

  // Draw the screen
  currentScreen.forEach((line) => {
    console.log(line);
  });
}

/**
 * Render a single node from the DOM tree
 * @param {object} node - DOM node
 * @param {number} depth - Current nesting depth
 * @param {number} x - X position
 * @param {number} maxWidth - Maximum width
 * @param {object} viewport - Current viewport info
 */
function renderNode(node, depth, x, maxWidth, viewport) {
  if (!node) return;

  // Handle text nodes
  if (node.type === "text") {
    renderText(node.content, x, maxWidth, viewport);
    return;
  }

  // Handle element nodes
  if (node.type === "element") {
    // Store element reference
    if (node.id) {
      elements.set(node.id, {
        node,
        viewport: { ...viewport },
      });
    }

    switch (node.tagName) {
      case "div":
        renderDiv(node, depth, x, maxWidth, viewport);
        break;
      case "h1":
        renderHeading(node, 1, depth, x, maxWidth, viewport);
        break;
      case "h2":
        renderHeading(node, 2, depth, x, maxWidth, viewport);
        break;
      case "p":
        renderParagraph(node, depth, x, maxWidth, viewport);
        break;
      case "button":
        renderButton(node, depth, x, maxWidth, viewport);
        break;
      case "input":
        renderInput(node, depth, x, maxWidth, viewport);
        break;
      case "select":
        renderSelect(node, depth, x, maxWidth, viewport);
        break;
      case "ul":
      case "ol":
        renderList(node, depth, x, maxWidth, viewport);
        break;
      default:
        // Render unknown elements as containers
        renderDiv(node, depth, x, maxWidth, viewport);
    }
  }
}

// Element-specific render functions

function renderDiv(node, depth, x, maxWidth, viewport) {
  const hasClasses = node.classes.length > 0;
  const hasBox =
    node.classes.includes("box") || node.classes.includes("container");

  let currentY = viewport.y;
  let childViewport = { ...viewport };

  if (hasBox) {
    // Add some padding for box containers
    childViewport = {
      ...viewport,
      x: viewport.x + 2,
      y: viewport.y + 1,
      width: viewport.width - 4,
      height: viewport.height - 2,
    };

    // Draw the box
    ensureLine(viewport.y);
    currentScreen[viewport.y] = drawBoxTop(maxWidth, viewport.x);
    currentY++;
  }

  // Render children
  node.children.forEach((child) => {
    renderNode(child, depth + 1, childViewport.x, childViewport.width, {
      ...childViewport,
      y: currentY,
    });
    currentY++;
  });

  if (hasBox) {
    // Close the box
    ensureLine(currentY);
    currentScreen[currentY] = drawBoxBottom(maxWidth, viewport.x);
  }
}

function renderHeading(node, level, depth, x, maxWidth, viewport) {
  // Combine all text content
  const text = collectTextContent(node);

  // Format based on heading level
  let formattedText;
  switch (level) {
    case 1:
      formattedText = chalk.bold.underline(text.toUpperCase());
      break;
    case 2:
      formattedText = chalk.bold(text);
      break;
    default:
      formattedText = chalk.italic(text);
  }

  // Add padding for headings
  ensureLine(viewport.y - 1);
  ensureLine(viewport.y);
  currentScreen[viewport.y] = padLeft(" " + formattedText, x);
  ensureLine(viewport.y + 1);
}

function renderParagraph(node, depth, x, maxWidth, viewport) {
  const text = collectTextContent(node);
  // Simple word wrapping
  const words = text.split(" ");
  let line = "";
  let currentLine = viewport.y;

  words.forEach((word) => {
    if ((line + " " + word).length > maxWidth) {
      ensureLine(currentLine);
      currentScreen[currentLine] = padLeft(line, x);
      line = word;
      currentLine++;
    } else {
      line = line ? line + " " + word : word;
    }
  });

  // Add the last line
  if (line) {
    ensureLine(currentLine);
    currentScreen[currentLine] = padLeft(line, x);
  }
}

function renderButton(node, depth, x, maxWidth, viewport) {
  const text = collectTextContent(node);
  const btnText = ` ${text} `;
  const isActive = focusedElementId === node.id;

  // Style based on state
  let formattedBtn;
  if (isActive) {
    formattedBtn = chalk.bgGreen.black(btnText);
  } else {
    formattedBtn = chalk.bgGray.white(btnText);
  }

  // Add button border
  const buttonWithBorder = `[${formattedBtn}]`;

  ensureLine(viewport.y);
  currentScreen[viewport.y] = padLeft(buttonWithBorder, x);
}

function renderInput(node, depth, x, maxWidth, viewport) {
  const type = node.attributes.type || "text";
  const placeholder = node.attributes.placeholder || "";
  const value = node.attributes.value || "";
  const isActive = focusedElementId === node.id;

  // Style based on type and state
  let displayValue = value || chalk.gray(placeholder);
  if (isActive) {
    displayValue = chalk.bgWhite.black(displayValue + "▌"); // Add cursor
  }

  // Create input field display
  const fieldWidth = Math.min(maxWidth - 2, 30);
  const field = " " + displayValue.padEnd(fieldWidth, " ") + " ";
  const boxedField = boxen(field, {
    padding: 0,
    borderStyle: isActive ? "double" : "single",
  });

  ensureLine(viewport.y);
  currentScreen[viewport.y] = padLeft(boxedField, x);
}

function renderSelect(node, depth, x, maxWidth, viewport) {
  const isActive = focusedElementId === node.id;

  // Get option elements
  const options = node.children.filter(
    (child) => child.type === "element" && child.tagName === "option"
  );

  // Find selected option
  const selectedOption =
    options.find((opt) => opt.attributes.selected) || options[0];
  const selectedText = selectedOption ? collectTextContent(selectedOption) : "";

  // Style dropdown
  let displayValue = ` ${selectedText} ▼ `;
  if (isActive) {
    displayValue = chalk.bgCyan.black(displayValue);
  } else {
    displayValue = chalk.bgWhite.black(displayValue);
  }

  ensureLine(viewport.y);
  currentScreen[viewport.y] = padLeft(displayValue, x);
}

function renderList(node, depth, x, maxWidth, viewport) {
  const isOrdered = node.tagName === "ol";
  let currentY = viewport.y;

  // Find list items
  const items = node.children.filter(
    (child) => child.type === "element" && child.tagName === "li"
  );

  items.forEach((item, index) => {
    const text = collectTextContent(item);
    const bullet = isOrdered ? `${index + 1}.` : "•";

    ensureLine(currentY);
    currentScreen[currentY] = padLeft(`${bullet} ${text}`, x);
    currentY++;
  });
}

function renderText(text, x, maxWidth, viewport) {
  ensureLine(viewport.y);
  let currentStr = currentScreen[viewport.y] || "";
  const padLength = Math.max(0, x - stripAnsi(currentStr).length);
  currentScreen[viewport.y] = currentStr + " ".repeat(padLength) + text;
}

// Helper functions

function collectTextContent(node) {
  if (node.type === "text") return node.content;

  if (node.children) {
    return node.children
      .map((child) => collectTextContent(child))
      .join("")
      .replace(/\s+/g, " ")
      .trim();
  }

  return "";
}

function ensureLine(lineIndex) {
  while (currentScreen.length <= lineIndex) {
    currentScreen.push("");
  }
}

function padLeft(str, spaces) {
  return " ".repeat(spaces) + str;
}

function drawBoxTop(width, x) {
  return padLeft("┌" + "─".repeat(width - 2) + "┐", x);
}

function drawBoxBottom(width, x) {
  return padLeft("└" + "─".repeat(width - 2) + "┘", x);
}

module.exports = {
  render,
};
