# NodeEssentials

#### Node essentials is a module made for those who is tired of having to setup express, dotenv and cookieparser for all of their projects

## Installation

Install it like this:

```bash
npm install nodeessentials
```

or, you can clone the repo

```bash
git clone https://github.com/Grizak/node_modules.git
mv node_modules/nodeessentials nodeessentials
rm -rf node_modules
cd nodeessentials
npm install
```

## Features

- **express**: It has built in express, with also creating an instance of express, using cookie-parser, express.json and express.urlencoded, for your sanity.
- **dotenv**: dotenv is also built-into the module, it is also used automaticly so that you don't have to think about it.
- **nodeloggerg**: nodeloggerg is also built-in, it is automaticly creating an instance of it with the startwebserver set to true, witch means that it is going to use up the port 9001, keep that in mind.
- **ejs**: ejs is built in, I am not doing anything with it exept exporting it
- **socket.io**: socket.io is also a built-in module, I am not doing anything with it exept exporting it

## Usage

You can use this package in many diffrent ways

```javascript
// Import the module
const nodeessentials = require("nodeessentials");

// Or, you can just import the modules you want
const {
  express, // The express module
  dotenv, // The dotenv module
  ejs, // The ejs module
  socketIo, // The socket.io module
  cookieparser, // The cookie-parser module
  nodeloggerg, // The nodeloggerg module
  app, // The pre-configured express module
  logger, // The preconfigured nodeloggerg module
} = require("nodeessentials");
```

## License

This project is licenced under the MIT License - see the `LICENSE` file for details
