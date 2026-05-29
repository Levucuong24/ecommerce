const config = require("../config/env");

const notFound = (req, res, next) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    message: error.message || "Internal server error",
    ...(config.env !== "production" && { stack: error.stack }),
  });
};

module.exports = {
  notFound,
  errorHandler,
};
