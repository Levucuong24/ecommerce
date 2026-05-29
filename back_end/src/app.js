const express = require("express");
const cors = require("cors");

const config = require("./config/env");
const apiRouter = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.json({
    message: "Ecommerce backend is running",
  });
});

app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
