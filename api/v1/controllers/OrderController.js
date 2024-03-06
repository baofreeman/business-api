const Order = require("../models/order");
const express = require("express");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_KEY);

class OrderController {
  async getOrder(req, res) {
    const orders = await Order.find().exec();
    if (!orders) {
      return res.status(401).json({ message: "No data" });
    }
    return res.status(200).json(orders);
  }
  async getOrderDetail(req, res) {
    const { orderId } = req.body;
    const order = await Order.findOne({ _id: orderId }).exec();
    if (!order) {
      return res.status(401).json({ message: "No data" });
    }
    return res.status(200).json(order);
  }
  async createOrder(req, res) {
    const {
      name,
      phone,
      district,
      province,
      cart,
      note,
      totalPrice,
      itemsPrice,
      shippingPrice,
      totalQuantity,
      paymentMethod,
    } = req.body;
    const newOrder = new Order({
      billingAddress: {
        name: name,
        phone: phone,
        district: district,
        province: province,
      },
      items: cart,
      paymentMethod,
      shippingPrice,
      note,
      itemsPrice,
      totalPrice,
      totalQuantity,
    });
    const saveOrder = await Order.create(newOrder);
    console.log(saveOrder);
    if (saveOrder) {
      return res.send({ url: `/checkout/success` });
    } else {
      return res.status(401).json({ message: "Invalid Data" });
    }
  }
}

module.exports = new OrderController();
