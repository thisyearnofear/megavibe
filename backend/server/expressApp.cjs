// expressApp.cjs
const express = require("express");
const cors = require("cors");
const Waitlist = require("./models/Waitlist.cjs");

function configureMiddleware(app) {
  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );
}

function createExpressApp(app) {
  app.use(express.json());
  configureMiddleware(app);

  // Define the /waitlist route
  app.post("/waitlist", (req, res) => {
    const { name, email, link } = req.body;

    // Create a new document in the 'waitlist' collection
    const newWaitlistEntry = new Waitlist({ name, email, link });

    newWaitlistEntry
      .save()
      .then(() => res.json("Waitlist entry added!"))
      .catch((err) => res.status(400).json("Error: " + err));
  });
}

module.exports = createExpressApp;
