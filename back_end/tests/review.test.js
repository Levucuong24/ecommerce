require("dotenv").config();
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const connectDatabase = require("../src/config/db");
const { User, Store, Product, Review } = require("../src/models");
const reviewService = require("../src/modules/review/review.service");

describe("Review Service Tests", () => {
  let testUser;
  let testStore;
  let testProduct;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await connectDatabase();
    }

    const email = "review_test_" + Date.now() + "@gmail.com";
    testUser = await User.create({
      _id: new mongoose.Types.ObjectId(),
      name: "Review Test User",
      email,
      role: "customer",
    });

    testStore = await Store.create({
      _id: new mongoose.Types.ObjectId(),
      name: "Review Test Store " + Date.now(),
      slug: "review-test-store-" + Date.now(),
      ownerId: testUser._id,
      status: "active",
    });

    testProduct = await Product.create({
      _id: new mongoose.Types.ObjectId(),
      name: "Review Test Product",
      slug: "review-test-product-" + Date.now(),
      price: 15000,
      stock: 10,
      storeId: testStore._id,
      ratingAverage: 0,
      ratingCount: 0,
    });
  });

  after(async () => {
    if (testProduct) {
      await Review.deleteMany({ productId: testProduct._id });
      await Product.findByIdAndDelete(testProduct._id);
    }
    if (testStore) {
      await Store.findByIdAndDelete(testStore._id);
    }
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
    }
    await mongoose.connection.close();
  });

  it("should aggregate product ratings accurately using database-level logic", async () => {
    // 1. Initial product should have 0 rating average and count
    let prod = await Product.findById(testProduct._id);
    assert.strictEqual(prod.ratingAverage, 0);
    assert.strictEqual(prod.ratingCount, 0);

    // 2. Add first review (5 stars)
    await reviewService.createReview(testUser._id, {
      productId: testProduct._id,
      rating: 5,
      comment: "Superb product!",
    });

    prod = await Product.findById(testProduct._id);
    assert.strictEqual(prod.ratingAverage, 5);
    assert.strictEqual(prod.ratingCount, 1);

    // 3. Add second review (2 stars) -> average should be (5+2)/2 = 3.5
    await reviewService.createReview(testUser._id, {
      productId: testProduct._id,
      rating: 2,
      comment: "Not satisfied.",
    });

    prod = await Product.findById(testProduct._id);
    assert.strictEqual(prod.ratingAverage, 3.5);
    assert.strictEqual(prod.ratingCount, 2);
  });
});
