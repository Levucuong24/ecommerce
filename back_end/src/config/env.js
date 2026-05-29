require("dotenv").config();

const requiredEnv = [
  "MONGODB_URI",
  "JWT_SECRET",
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error("❌ Critical Error: Missing required environment variables:");
  missingEnv.forEach((key) => console.error(`   - ${key}`));
  process.exit(1);
}

const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  seedDropExisting: process.env.SEED_DROP_EXISTING === "true",
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT, 10) || 465,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
};

module.exports = config;
