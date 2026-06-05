const express = require("express");
const userController = require("./user.controller");
const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");

const router = express.Router();

// Authenticated user routes
router.use(protect);
router.post("/check-in", userController.checkIn);
router.get("/coins-status", userController.getCoinsStatus);
router.post("/spin-wheel", userController.spinWheel);

// Only admin can manage users
router.use(authorize("admin"));

router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.patch("/:id/role", userController.updateRole);

module.exports = router;
