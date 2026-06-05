const express = require("express");
const cors = require("cors");

const config = require("./config/env");
const apiRouter = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

const allowedOrigins = [
  config.clientUrl,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"), false);
    },
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
