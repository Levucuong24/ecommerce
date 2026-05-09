const express = require("express");
const cors = require("cors");

const apiRouter = require("./routes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Ecommerce backend is running",
  });
});

app.use("/api", apiRouter);

module.exports = app;
