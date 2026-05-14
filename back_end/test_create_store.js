const mongoose = require("mongoose");
require("dotenv").config();
const { Store } = require("./src/models");
const slugify = require("./src/utils/slugify");

async function manualCreateStore() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
    
    const userId = "6a036f2d54e7aa8408013fce"; // shop@example.com
    const storeName = "Test Shop " + Date.now();
    const slug = slugify(storeName);
    
    const store = await Store.create({
      _id: new mongoose.Types.ObjectId(),
      name: storeName,
      description: "Test description",
      slug,
      ownerId: userId,
      status: "pending"
    });
    
    console.log("Store created:", store);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

manualCreateStore();
