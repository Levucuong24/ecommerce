const jwt = require("jsonwebtoken");
const config = require("../config/env");

const generateToken = (user) =>
  jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: "7d" }
  );

module.exports = generateToken;
