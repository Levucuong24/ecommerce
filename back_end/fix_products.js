const mongoose = require("mongoose");
const path = require("path");

// Load models
const Product = require("./src/models/product.model");
const Category = require("./src/models/category.model");

async function fixProducts() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/ecommerceDB");
    console.log("Connected to MongoDB");

    const category = await Category.findOne({ name: "Thời Trang Trẻ Em" });
    if (!category) {
      console.log("Category 'Thời Trang Trẻ Em' not found");
      return;
    }

    const result = await Product.updateMany(
      { categoryId: "6a05fab2b8b71019e9bbe92c" },
      { $set: { categoryId: category._id } }
    );

    console.log(`Updated ${result.modifiedCount} products from old ID to category 'Thời Trang Trẻ Em'`);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
}

fixProducts();
