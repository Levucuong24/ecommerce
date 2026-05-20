const mongoose = require('mongoose');
require('./src/models');
const Product = mongoose.model('Product');

async function check() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ecommerce');
    const flashProducts = await Product.find({ isFlashSale: true });
    console.log('Total Flash Sale products:', flashProducts.length);
    flashProducts.forEach(p => {
      console.log(`- Product: ${p.name}`);
      console.log(`  Discount Price: ${p.discountPrice}`);
      console.log(`  Original Price: ${p.price}`);
      console.log(`  Start: ${p.flashSaleStartTime}`);
      console.log(`  End: ${p.flashSaleEndTime}`);
      console.log(`  Current Time: ${new Date().toISOString()}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();