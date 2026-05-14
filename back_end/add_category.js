const mongoose = require("mongoose");
require("dotenv").config();
const { Category } = require("./src/models");
const slugify = require("./src/utils/slugify");

async function addCategory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
    
    const name = "Áo trẻ";
    const slug = slugify(name);
    
    const existing = await Category.findOne({ slug });
    if (existing) {
      console.log("Category already exists:", existing.name);
      process.exit(0);
    }
    
    const category = await Category.create({
      _id: new mongoose.Types.ObjectId(),
      name,
      slug
    });
    
    console.log("Category created:", category.name);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

addCategory();
