require("dotenv").config();
const mongoose = require("mongoose");
const connectDatabase = require("../src/config/db");
const { User, Store } = require("../src/models");
const storeService = require("../src/modules/store/store.service");

async function runTest() {
  try {
    await connectDatabase();
    console.log("Database connected successfully.");

    // 1. Create a test user
    const userEmail = "test_merchant_" + Date.now() + "@gmail.com";
    const testUser = await User.create({
      _id: new mongoose.Types.ObjectId(),
      name: "Test Merchant",
      email: userEmail,
      role: "customer",
    });
    console.log(`Created test user: ${testUser.name} with role: ${testUser.role}`);

    // 2. Create a pending store for this user
    const testStore = await Store.create({
      _id: new mongoose.Types.ObjectId(),
      name: "Test Store " + Date.now(),
      slug: "test-store-" + Date.now(),
      ownerId: testUser._id,
      status: "pending",
    });
    console.log(`Created test store: ${testStore.name} with status: ${testStore.status}`);

    // 3. Approve the store (status active)
    console.log("\n--- Action: Approve Store (status: active) ---");
    await storeService.approveStore(testStore._id, "active");

    // Fetch updated user & store
    let updatedUser = await User.findById(testUser._id);
    let updatedStore = await Store.findById(testStore._id);
    console.log(`Updated Store Status: ${updatedStore.status}`);
    console.log(`Updated User Role: ${updatedUser.role} (Expected: staff)`);

    if (updatedUser.role !== "staff") {
      throw new Error("Test Failed: User role did not change to staff when store was approved.");
    }

    // 4. Disable / Lock the store (status inactive)
    console.log("\n--- Action: Lock Store (status: inactive) ---");
    await storeService.approveStore(testStore._id, "inactive");

    // Fetch updated user & store again
    updatedUser = await User.findById(testUser._id);
    updatedStore = await Store.findById(testStore._id);
    console.log(`Updated Store Status: ${updatedStore.status}`);
    console.log(`Updated User Role: ${updatedUser.role} (Expected: customer)`);

    if (updatedUser.role !== "customer") {
      throw new Error("Test Failed: User role did not change back to customer when store was locked.");
    }

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! User role transitions correctly on store approval and lock.");

    // Clean up
    await Store.findByIdAndDelete(testStore._id);
    await User.findByIdAndDelete(testUser._id);
    console.log("Cleanup completed.");

  } catch (error) {
    console.error("Test failed with error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
}

runTest();
