const express = require("express");
const cookieparser = require("cookie-parser");
const dotenv = require("dotenv");
const ejs = require("ejs");
const nodeloggerg = require("nodeloggerg");
const socketIo = require("socket.io");
const app = require("./express");

const logger = new nodeloggerg({
  startWebServer: true,
});

module.exports = {
  express,
  cookieparser,
  dotenv,
  ejs,
  nodeloggerg,
  socketIo,
  app,
  logger,
};
