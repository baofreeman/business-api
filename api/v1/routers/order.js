const express = require("express");
const OrderController = require("../controllers/OrderController");
const router = express.Router();

router
  .route("/")
  .get(OrderController.getOrder)
  .post(OrderController.createOrder);

router.route("/order-detail").get(OrderController.getOrderDetail);

module.exports = router;
