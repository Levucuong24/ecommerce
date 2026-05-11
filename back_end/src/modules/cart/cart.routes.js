const express = require("express");
const cartController = require("./cart.controller");

const router = express.Router();

router.get("/", cartController.getCarts);
router.get("/:id", cartController.getCartById);

module.exports = router;
