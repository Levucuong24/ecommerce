const mongoose = require('mongoose');
const Store = require('../src/models/store.model');
const User = require('../src/models/user.model');
require('dotenv').config();

const listShops = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerceDB');
    console.log('Đã kết nối MongoDB');

    const stores = await Store.find().populate('ownerId');
    console.log('Danh sách Shop hiện có:');
    stores.forEach(s => {
      console.log(`- Tên: "${s.name}" | Owner: "${s.ownerId?.email}" | ID: ${s._id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    process.exit(1);
  }
};

listShops();
