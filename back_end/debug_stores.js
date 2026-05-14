const mongoose = require("mongoose");
require("dotenv").config();
const { Store } = require("./src/models");

async function checkStores() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
    const stores = await Store.find().populate("ownerId", "name email");
    console.log("Total stores:", stores.length);
    console.log(JSON.stringify(stores, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkStores();
