const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    price: { type: Number, required: true },
    discountPrice: Number,
    stock: { type: Number, default: 0 },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    images: [String],
    colors: {
      type: [
        {
          name: { type: String, required: true },
          hex: { type: String, default: "#cccccc" },
          price: { type: Number, required: true },
          discountPrice: { type: Number },
          stock: { type: Number, default: 0 },
          images: [String],
        },
      ],
      default: [],
    },
    attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    likes: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
    likeCount: { type: Number, default: 0 },
    isFlashSale: { type: Boolean, default: false },
    flashSaleStartTime: { type: Date },
    flashSaleEndTime: { type: Date },
    flashSaleDiscountPercent: { type: Number, default: 0 },
  },
  {
    versionKey: false,
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        const now = new Date();
        const isActive = ret.isFlashSale && 
          (!ret.flashSaleStartTime || new Date(ret.flashSaleStartTime) <= now) &&
          (!ret.flashSaleEndTime || new Date(ret.flashSaleEndTime) >= now);
        
        if (isActive && ret.flashSaleDiscountPercent > 0) {
          ret.discountPrice = Math.round(ret.price * (1 - ret.flashSaleDiscountPercent / 100));
          if (ret.colors && ret.colors.length > 0) {
            ret.colors = ret.colors.map(c => ({
              ...c,
              discountPrice: Math.round(c.price * (1 - ret.flashSaleDiscountPercent / 100))
            }));
          }
        }
        return ret;
      }
    },
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        const now = new Date();
        const isActive = ret.isFlashSale && 
          (!ret.flashSaleStartTime || new Date(ret.flashSaleStartTime) <= now) &&
          (!ret.flashSaleEndTime || new Date(ret.flashSaleEndTime) >= now);
        
        if (isActive && ret.flashSaleDiscountPercent > 0) {
          ret.discountPrice = Math.round(ret.price * (1 - ret.flashSaleDiscountPercent / 100));
          if (ret.colors && ret.colors.length > 0) {
            ret.colors = ret.colors.map(c => ({
              ...c,
              discountPrice: Math.round(c.price * (1 - ret.flashSaleDiscountPercent / 100))
            }));
          }
        }
        return ret;
      }
    }
  }
);

module.exports = mongoose.model("Product", productSchema);
