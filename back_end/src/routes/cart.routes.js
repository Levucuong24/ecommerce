const express = require("express");
const cartController = require("../controllers/cart/cart.controller");

const router = express.Router();

router.get("/", cartController.getCarts);
router.get("/:id", cartController.getCartById);

module.exports = router;
