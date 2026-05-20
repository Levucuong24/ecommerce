require('dotenv').config();
const mongoose = require('mongoose');
const { User, Coupon } = require('./src/models');

async function giveWelcomeVouchers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');

    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    let count = 0;
    for (const user of users) {
      const existingCoupon = await Coupon.findOne({
        userId: user._id,
        code: 'WELCOME17'
      });

      if (!existingCoupon) {
        await Coupon.create({
          userId: user._id,
          code: 'WELCOME17',
          discountPercent: 17,
          minOrder: 0,
          type: 'percent',
          expiryDate: new Date('2026-12-31')
        });
        count++;
      }
    }

    console.log(`Successfully gave welcome vouchers to ${count} users`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

giveWelcomeVouchers();