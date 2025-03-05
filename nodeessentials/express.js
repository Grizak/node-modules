const express = require("express");
require("dotenv").config();
const cookieparser = require("cookie-parser");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieparser());

module.exports = app;
