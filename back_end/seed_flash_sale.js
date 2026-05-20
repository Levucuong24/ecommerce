const mongoose = require('mongoose');
require('./src/models');
const Product = mongoose.model('Product');

async function seed() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ecommerce');
    
    // Tìm 3 sản phẩm bất kỳ để làm Flash Sale
    const products = await Product.find().limit(3);
    
    if (products.length === 0) {
      console.log('No products found to seed Flash Sale');
      process.exit(0);
    }

    const now = new Date();
    const startTime = new Date(now.getTime() - 60 * 60 * 1000); // Cách đây 1 tiếng
    const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 tiếng sau

    for (const p of products) {
      p.isFlashSale = true;
      p.flashSaleStartTime = startTime.toISOString();
      p.flashSaleEndTime = endTime.toISOString();
      
      // Đảm bảo có giá giảm
      if (!p.discountPrice || p.discountPrice >= p.price) {
        p.discountPrice = Math.floor(p.price * 0.8); // Giảm 20%
      }
      
      await p.save();
      console.log(`Enabled Flash Sale for: ${p.name}`);
    }

    console.log('Flash Sale seeding completed.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();