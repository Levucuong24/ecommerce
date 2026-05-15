const mongoose = require('mongoose');
const Store = require('../src/models/store.model');
const User = require('../src/models/user.model');
require('dotenv').config();

const deleteShop = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerceDB');
    console.log('Đã kết nối MongoDB');

    const shopName = 'GALAXY Official Store';
    const ownerEmail = 'shop@example.com';

    // Find user by email
    const user = await User.findOne({ email: ownerEmail });
    if (!user) {
      console.log('Không tìm thấy người dùng với email:', ownerEmail);
      process.exit(1);
    }

    // Find store by name and ownerId
    const store = await Store.findOne({ name: shopName, ownerId: user._id });
    if (!store) {
      console.log('Không tìm thấy Shop:', shopName, 'thuộc sở hữu của:', ownerEmail);
      process.exit(1);
    }

    // Delete the store
    await Store.deleteOne({ _id: store._id });
    console.log('Đã xóa thành công Shop:', shopName);

    // Optionally: Update user role back to customer if they have no other shops?
    // In this app, a staff usually owns one shop.
    user.role = 'customer';
    await user.save();
    console.log('Đã cập nhật vai trò người dùng thành customer');

    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi xóa Shop:', error);
    process.exit(1);
  }
};

deleteShop();
