const express = require("express");
const storeController = require("./store.controller");
const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");

const router = express.Router();

router.post("/", protect, authorize("staff"), storeController.createStore);
router.get("/my-store", protect, authorize("staff"), storeController.getMyStore);
router.patch("/my-store", protect, authorize("staff"), storeController.updateStore);
router.get("/following", protect, storeController.getFollowingStores);
router.patch("/online-status", protect, authorize("staff"), storeController.updateOnlineStatus);
router.get("/:id", storeController.getStoreById);
router.get("/:id/products", storeController.getStoreProducts);
router.get("/:id/reviews", storeController.getStoreReviews);
router.post("/:id/follow", protect, storeController.toggleFollowStore);

// Admin routes
router.get("/", protect, authorize("admin"), storeController.getAllStores);
router.patch("/:id/status", protect, authorize("admin"), storeController.updateStoreStatus);

module.exports = router;
