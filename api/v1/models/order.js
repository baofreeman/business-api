const mongoose = require("mongoose");

const OrderItem = mongoose.Schema(
  {
    billingAddress: {
      name: { type: String, required: true },
      district: { type: String, required: true },
      province: { type: String, required: true },
      phone: { type: String, required: true },
    },
    deliveryStatus: {
      type: String,
      default: "pending",
    },
    paymentMethod: {
      type: String,
      required: true,
      default: "cash_on_delivery",
    },
    items: { type: Array, required: true },
    note: { type: String, default: "Nothing" },
    totalQuantity: { type: String, required: true },
    shippingPrice: { type: Number, default: 30000 },
    itemsPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = new mongoose.model("Order", OrderItem);
