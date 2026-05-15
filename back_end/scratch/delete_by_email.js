const mongoose = require('mongoose');
const Store = require('../src/models/store.model');
const User = require('../src/models/user.model');
require('dotenv').config();

const deleteByEmail = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerceDB');
    const ownerEmail = 'shop@example.com';

    const user = await User.findOne({ email: ownerEmail });
    if (!user) {
      console.log('Không tìm thấy người dùng shop@example.com');
      process.exit(0);
    }

    const result = await Store.deleteMany({ ownerId: user._id });
    console.log(`Đã xóa ${result.deletedCount} shop thuộc về ${ownerEmail}`);

    user.role = 'customer';
    await user.save();
    console.log('Đã cập nhật role thành customer');

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

deleteByEmail();
