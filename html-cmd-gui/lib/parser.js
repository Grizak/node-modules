// lib/parser.js - HTML parsing module

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

/**
 * Parse HTML string into a DOM-like structure we can use
 * @param {string} html - HTML content
 * @returns {object} DOM-like tree structure
 */
function parse(html) {
  // Use jsdom for parsing HTML
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Convert DOM to our simplified structure
  return domToTree(document.body);
}

/**
 * Recursively convert DOM to our custom tree structure
 * @param {Node} domNode - JSDOM node
 * @returns {object} Simplified tree node
 */
function domToTree(domNode) {
  // Skip text nodes with only whitespace
  if (domNode.nodeType === 3 && domNode.textContent.trim() === "") {
    return null;
  }

  // Process text nodes
  if (domNode.nodeType === 3) {
    return {
      type: "text",
      content: domNode.textContent,
    };
  }

  // Process element nodes
  if (domNode.nodeType === 1) {
    const node = {
      type: "element",
      tagName: domNode.tagName.toLowerCase(),
      id: domNode.id || null,
      classes: domNode.className
        ? domNode.className.split(" ").filter((c) => c)
        : [],
      attributes: {},
      children: [],
    };

    // Extract attributes
    Array.from(domNode.attributes).forEach((attr) => {
      if (attr.name !== "id" && attr.name !== "class") {
        node.attributes[attr.name] = attr.value;
      }
    });

    // Process children recursively
    Array.from(domNode.childNodes).forEach((childNode) => {
      const childTree = domToTree(childNode);
      if (childTree) {
        node.children.push(childTree);
      }
    });

    return node;
  }

  return null;
}

module.exports = {
  parse,
};
