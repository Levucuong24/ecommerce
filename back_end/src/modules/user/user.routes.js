const express = require("express");
const userController = require("./user.controller");
const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");

const router = express.Router();

// Only admin can manage users
router.use(protect);
router.use(authorize("admin"));

router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.patch("/:id/role", userController.updateRole);

module.exports = router;
