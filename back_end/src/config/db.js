const mongoose = require("mongoose");
const config = require("./env");

const connectDatabase = async () => {
  await mongoose.connect(config.mongodbUri);
  console.log("MongoDB connected");
};

module.exports = connectDatabase;
