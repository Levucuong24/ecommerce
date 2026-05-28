require("dotenv").config();
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const connectDatabase = require("../src/config/db");
const { User, Store } = require("../src/models");
const storeService = require("../src/modules/store/store.service");

describe("Store Service Tests", () => {
  let testUser;
  let testStore;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await connectDatabase();
    }

    const email = "store_test_" + Date.now() + "@gmail.com";
    testUser = await User.create({
      _id: new mongoose.Types.ObjectId(),
      name: "Store Owner User",
      email,
      role: "customer",
    });

    testStore = await Store.create({
      _id: new mongoose.Types.ObjectId(),
      name: "Auto Test Store " + Date.now(),
      slug: "auto-test-store-" + Date.now(),
      ownerId: testUser._id,
      status: "pending",
    });
  });

  after(async () => {
    if (testStore) {
      await Store.findByIdAndDelete(testStore._id);
    }
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
    }
    await mongoose.connection.close();
  });

  it("should upgrade owner role to staff when store is approved (active)", async () => {
    await storeService.approveStore(testStore._id, "active");

    const updatedStore = await Store.findById(testStore._id);
    const updatedUser = await User.findById(testUser._id);

    assert.strictEqual(updatedStore.status, "active");
    assert.strictEqual(updatedUser.role, "staff");
  });

  it("should downgrade owner role to customer when store is suspended (inactive)", async () => {
    await storeService.approveStore(testStore._id, "inactive");

    const updatedStore = await Store.findById(testStore._id);
    const updatedUser = await User.findById(testUser._id);

    assert.strictEqual(updatedStore.status, "inactive");
    assert.strictEqual(updatedUser.role, "customer");
  });
});
