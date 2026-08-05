const config = require("./src/config/env");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/user.model");

const MONGO_URI = config.mongodbUri;

async function createWarehouseUser() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB...");

    const email = "warehouse@example.com";
    const rawPassword = "warehouse123";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    let user = await User.findOne({ email });

    if (user) {
      user.password = hashedPassword;
      user.role = "warehouse";
      user.name = "Warehouse Manager";
      await user.save();
      console.log("✅ Updated existing user to Warehouse role.");
    } else {
      user = await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: "Warehouse Manager",
        email,
        password: hashedPassword,
        role: "warehouse",
        createdAt: new Date()
      });
      console.log("✅ Created new Warehouse Manager account.");
    }

    console.log("-----------------------------------------");
    console.log("Tài khoản Quản Lý Kho đã tạo thành công:");
    console.log(`Email: ${email}`);
    console.log(`Password: ${rawPassword}`);
    console.log(`Role: ${user.role}`);
    console.log("-----------------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to create warehouse user:", error);
    process.exit(1);
  }
}

createWarehouseUser();
