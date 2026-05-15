const mongoose = require('mongoose');
const Store = require('../src/models/store.model');
require('dotenv').config();

const searchShop = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerceDB');
    const stores = await Store.find({ name: /GALAXY/i });
    console.log('Kết quả tìm kiếm cho "GALAXY":');
    stores.forEach(s => console.log(`- ${s.name} (${s._id})`));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

searchShop();
