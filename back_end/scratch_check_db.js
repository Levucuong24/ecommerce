const mongoose = require("mongoose");
const path = require("path");

// Load models
const Product = require("./src/models/product.model");
const Category = require("./src/models/category.model");

async function checkProducts() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/ecommerceDB"); 
    console.log("Connected to MongoDB");

    const categories = await Category.find({}, "name _id");
    console.log("\n--- Categories ---");
    categories.forEach(c => console.log(`${c.name}: ${c._id}`));

    const targetCategory = categories.find(c => c.name.includes("Thời Trang Trẻ Em"));
    if (!targetCategory) {
      console.log("\nCategory 'Thời Trang Trẻ Em' not found");
    } else {
      console.log(`\nTarget Category ID: ${targetCategory._id}`);
      
      const products = await Product.find({ categoryId: targetCategory._id });
      console.log(`\nProducts with target categoryId (${products.length}):`);
      products.forEach(p => console.log(`- ${p.name} (ID: ${p._id})`));

      const allProducts = await Product.find({});
      console.log(`\nTotal Products in DB: ${allProducts.length}`);
      allProducts.forEach(p => {
        console.log(`- Product: ${p.name} | CategoryId: ${p.categoryId} | Type: ${typeof p.categoryId}`);
      });
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
}

checkProducts();
