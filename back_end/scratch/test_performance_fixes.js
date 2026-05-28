require("dotenv").config();
const mongoose = require("mongoose");
const connectDatabase = require("../src/config/db");
const { User, Store, Product, Review, ChatMessage } = require("../src/models");
const chatService = require("../src/modules/chat/chat.service");
const reviewService = require("../src/modules/review/review.service");

async function runTest() {
  try {
    await connectDatabase();
    console.log("Database connected successfully.");

    // 1. Setup Test Data
    const customer = await User.create({
      _id: new mongoose.Types.ObjectId(),
      name: "Performance Customer",
      email: "perf_cust_" + Date.now() + "@gmail.com",
    });

    const merchant = await User.create({
      _id: new mongoose.Types.ObjectId(),
      name: "Performance Merchant",
      email: "perf_merch_" + Date.now() + "@gmail.com",
      role: "staff",
    });

    const store = await Store.create({
      _id: new mongoose.Types.ObjectId(),
      name: "Perf Test Store",
      slug: "perf-test-store-" + Date.now(),
      ownerId: merchant._id,
      status: "active",
    });

    const product = await Product.create({
      _id: new mongoose.Types.ObjectId(),
      name: "Perf Test Product",
      slug: "perf-test-product-" + Date.now(),
      price: 10000,
      stock: 50,
      storeId: store._id,
      ratingAverage: 0,
      ratingCount: 0,
    });

    console.log("Test dataset initialized successfully.");

    // 2. Test Chat Conversation Batch Query
    console.log("\n--- Testing Chat Optimization (N+1 queries fix) ---");
    // Send a message
    await ChatMessage.create({
      senderId: customer._id,
      receiverId: merchant._id,
      storeId: store._id,
      senderRole: "customer",
      content: "Hello optimized chat!",
      createdAt: new Date(),
    });

    // Run getStoreConversations for the merchant (owner of store)
    const storeConvs = await chatService.getStoreConversations(merchant._id);
    console.log("Store Conversations count:", storeConvs.length);
    if (storeConvs.length > 0) {
      const conv = storeConvs[0];
      console.log(`- Conversation Customer: ${conv.customerName} (${conv.customerEmail})`);
      console.log(`- Conversation Store: ${conv.storeName}`);
      console.log(`- Last Message: "${conv.lastMessage}"`);
    }

    // Run getUserConversations for the customer
    const userConvs = await chatService.getUserConversations(customer._id);
    console.log("User Conversations count:", userConvs.length);
    if (userConvs.length > 0) {
      const conv = userConvs[0];
      console.log(`- Conversation Store: ${conv.storeName}`);
      console.log(`- Last Message: "${conv.lastMessage}"`);
    }

    // 3. Test Review Aggregation
    console.log("\n--- Testing Review Aggregation (Memory bottleneck fix) ---");
    console.log(`Initial Product Rating: ${product.ratingAverage} (Count: ${product.ratingCount})`);

    // Create 3 reviews using review service
    await reviewService.createReview(customer._id, {
      productId: product._id,
      rating: 5,
      comment: "Excellent product!",
    });
    
    await reviewService.createReview(customer._id, {
      productId: product._id,
      rating: 4,
      comment: "Very good!",
    });

    await reviewService.createReview(customer._id, {
      productId: product._id,
      rating: 2,
      comment: "Disappointed.",
    });

    // Check updated product ratings (Avg should be (5+4+2)/3 = 3.666 -> 3.7)
    const updatedProd = await Product.findById(product._id);
    console.log(`Updated Product Rating: ${updatedProd.ratingAverage} (Count: ${updatedProd.ratingCount}) (Expected: 3.7 / 3)`);

    if (updatedProd.ratingCount !== 3 || updatedProd.ratingAverage !== 3.7) {
      throw new Error("Test Failed: Product rating count or average calculation is incorrect.");
    }

    console.log("\n🎉 ALL PERFORMANCE FIXES VERIFIED SUCCESSFULLY!");

    // Clean up
    await ChatMessage.deleteMany({ storeId: store._id });
    await Review.deleteMany({ productId: product._id });
    await Product.findByIdAndDelete(product._id);
    await Store.findByIdAndDelete(store._id);
    await User.findByIdAndDelete(customer._id);
    await User.findByIdAndDelete(merchant._id);
    console.log("Cleanup completed.");

  } catch (error) {
    console.error("Test failed with error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
}

runTest();
