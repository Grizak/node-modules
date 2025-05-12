# HTML-CMD-GUI

A Node.js package that renders HTML-like interfaces in the command line terminal.

## Overview

HTML-CMD-GUI lets you create terminal-based user interfaces using familiar HTML syntax. Write your UI once in HTML and render it both in browsers and terminals!

## Features

- Render HTML content in the terminal
- Support for common HTML elements (div, h1-h6, p, button, input, select, ul/ol)
- Interactive elements with event handling
- Styling using terminal colors and borders
- Simple navigation between UI elements

## Installation

```bash
npm install html-cmd-gui
```

## Usage

### Basic Example

```javascript
const htmlCmd = require("html-cmd-gui");

// Render HTML string
htmlCmd.render(
  `
 <div class="container">
   <h1>Hello Terminal!</h1>
   <p>This is a terminal UI generated from HTML.</p>
   <button id="myButton">Click Me</button>
 </div>
`,
  {
    events: {
      "#myButton": {
        click: () => console.log("Button clicked!"),
      },
    },
  }
);
```

### Loading from a File

```javascript
const htmlCmd = require("html-cmd-gui");
const fs = require("fs");

// Load HTML from file
const htmlContent = fs.readFileSync("myui.html", "utf8");

// Render the HTML
htmlCmd.render(htmlContent, {
  events: {
    "#loginBtn": {
      click: () => console.log("Login clicked!"),
    },
  },
});
```

### Command Line Interface

You can also use the CLI tool to render HTML files:

```bash
npx html-cmd render ./myui.html --scripts ./handlers.js
```

Where `handlers.js` exports an object with your event handlers:

```javascript
// handlers.js
module.exports = {
  "#myButton": {
    click: () => console.log("Button clicked!"),
  },
};
```

## Supported HTML Elements

- `<div>` - Container element
- `<h1>` to `<h6>` - Headings
- `<p>` - Paragraph text
- `<button>` - Clickable button
- `<input>` - Text input field
- `<select>` and `<option>` - Dropdown select
- `<ul>`, `<ol>`, and `<li>` - Lists

## Special Classes

- `box` or `container` - Renders the element with a border

## Navigation

- Use `Tab` to move between interactive elements
- Use `Enter` to activate buttons or confirm inputs
- Use `Ctrl+C` to exit the application

## Limitations

- Limited CSS support
- Basic layout only (no float or flex)
- Limited form control support

## Example Applications

See the `examples` folder for complete samples:

- Login form
- Todo list
- Simple dashboard

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT
