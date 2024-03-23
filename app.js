const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
require("dotenv").config();
const product = require("./api/v1/routers/product");
const order = require("./api/v1/routers/order");
const user = require("./api/v1/routers/user");
const auth = require("./api/v1/routers/auth");
const dbConnect = require("./api/v1/config/dbConect");
const cookieParser = require("cookie-parser");

dbConnect();
const corsOptions = {
  origin: ["https://business-web.onrender.com"],
  // origin: ["http://localhost:3000"],
  credentials: true,
};
app.use(
  express.json({
    verify: function (req, res, buf) {
      req.rawBody = buf;
    },
  })
);
app.use(cookieParser());

app.use(cors(corsOptions));
app.use("/product", product);
app.use("/order", order);
app.use("/user", user);
app.use("/auth", auth);

app.use("/uploads", express.static("uploads"));
app.use(express.urlencoded({ extended: true }));

module.exports = app;
