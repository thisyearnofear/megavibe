// config/sessionConfig.cjs

require("dotenv").config();

const session = require("express-session");
const MemoryStore = require("memorystore")(session);

const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({
    checkPeriod: 86400000, // 24 hours (in milliseconds)
  }),
  cookie: {
    maxAge: 86400000, // 24 hours (in milliseconds)
    secure: false, // Set to true in a production environment with HTTPS
  },
};

module.exports = sessionConfig;
