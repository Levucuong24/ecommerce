require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const connectDatabase = require("../config/db");
const models = require("../models");

const dataDirectory = path.resolve(__dirname, "..", "..");

const datasets = [
  { file: "users.json", model: models.User },
  { file: "addresses.json", model: models.Address },
  { file: "categories.json", model: models.Category },
  { file: "products.json", model: models.Product },
  { file: "reviews.json", model: models.Review },
  { file: "cart.json", model: models.Cart },
  { file: "orders.json", model: models.Order },
  { file: "payments.json", model: models.Payment },
  { file: "wishlist.json", model: models.Wishlist },
  { file: "coupons.json", model: models.Coupon },
  { file: "notifications.json", model: models.Notification },
];

const transformMongoExport = (value) => {
  if (Array.isArray(value)) {
    return value.map(transformMongoExport);
  }

  if (value && typeof value === "object") {
    if (Object.keys(value).length === 1 && value.$oid) {
      return new mongoose.Types.ObjectId(value.$oid);
    }

    if (Object.keys(value).length === 1 && value.$date) {
      return new Date(value.$date);
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        transformMongoExport(nestedValue),
      ])
    );
  }

  return value;
};

const seed = async () => {
  try {
    await connectDatabase();

    if (process.env.SEED_DROP_EXISTING === "true") {
      await mongoose.connection.db.dropDatabase();
      console.log("Dropped existing database");
    }

    for (const dataset of datasets) {
      const filePath = path.join(dataDirectory, dataset.file);
      const raw = fs.readFileSync(filePath, "utf8");
      const records = transformMongoExport(JSON.parse(raw));

      if (records.length > 0) {
        await dataset.model.insertMany(records);
      }

      console.log(`Seeded ${dataset.file}`);
    }

    console.log("Seed completed");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
};

seed();
