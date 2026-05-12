require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Product = require("./src/models/product.model");
const User = require("./src/models/user.model");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerceDB";

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    await Product.deleteMany({});
    await User.deleteMany({ email: { $in: ["shop@example.com", "admin@example.com"] } });
    console.log("Cleared existing data");

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const adminUser = await User.create({
      _id: new mongoose.Types.ObjectId(),
      name: "Admin Manager",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
      avatar: "admin_avatar.png",
      createdAt: new Date()
    });

    const shopUser = await User.create({
      _id: new mongoose.Types.ObjectId(),
      name: "GALAXY Official Store",
      email: "shop@example.com",
      password: hashedPassword,
      role: "staff",
      avatar: "shop_avatar.png",
      createdAt: new Date("2023-01-01")
    });

    const products = [
      {
        _id: new mongoose.Types.ObjectId(),
        name: "Đèn GALAXY Cực Quang USB LED Chiếu Bầu Trời Cực Quang Trang Trí, Decor Phòng Ngủ, Điều Khiển Từ Xa",
        slug: "den-galaxy-cuc-quang-usb-led",
        description: "Đèn GALAXY Cực Quang với nhiều chế độ màu sắc đẹp mắt, giúp không gian phòng ngủ của bạn trở nên lung linh và huyền ảo. Đi kèm điều khiển từ xa tiện lợi.",
        price: 100000,
        discountPrice: 59000,
        stock: 500,
        ratingAverage: 4.7,
        ratingCount: 9700,
        soldCount: 40500,
        isPublished: true,
        createdBy: shopUser._id,
        images: ["galaxy_lamp.png"]
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: "iPhone 15 Pro Max 256GB - Chính hãng VN/A",
        slug: "iphone-15-pro-max-256gb",
        description: "Siêu phẩm iPhone 15 Pro Max với khung viền Titan, chip A17 Pro mạnh mẽ và hệ thống camera chuyên nghiệp.",
        price: 34990000,
        discountPrice: 29990000,
        stock: 50,
        ratingAverage: 4.9,
        ratingCount: 1500,
        soldCount: 3200,
        isPublished: true,
        createdBy: shopUser._id,
        images: ["iphone15promax.png"]
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: "Tai nghe Bluetooth Marshall Major IV - Chính hãng",
        slug: "tai-nghe-marshall-major-iv",
        description: "Tai nghe chụp tai Marshall Major IV với thời lượng pin lên đến 80 giờ và thiết kế cổ điển đặc trưng.",
        price: 3990000,
        discountPrice: 3590000,
        stock: 120,
        ratingAverage: 4.8,
        ratingCount: 850,
        soldCount: 1200,
        isPublished: true,
        createdBy: shopUser._id,
        images: ["marshall_major_iv.png"]
      }
    ];

    await Product.insertMany(products);
    console.log("Inserted sample products and shop user");

    process.exit();
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
