const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const product = require("./api/v1/routers/product");
const order = require("./api/v1/routers/order");
const user = require("./api/v1/routers/user");
const auth = require("./api/v1/routers/auth");
const country = require("./api/v1/routers/country");
const dbConnect = require("./api/v1/config/dbConect");
const cookieParser = require("cookie-parser");

dbConnect();
const corsOptions = {
  origin: [`${process.env.CLIENT_URL}`],
  credentials: true,
};
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.CLIENT_URL);
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.use(
  express.json({
    verify: function (req, res, buf) {
      req.rawBody = buf;
    },
  })
);
app.use(cookieParser());

app.use(cors(corsOptions));
app.use("/v1/product", product);
app.use("/v1/order", order);
app.use("/v1/user", user);
app.use("/v1/auth", auth);
app.use("/v1/country", country);

app.use("/uploads", express.static("uploads"));
app.use(express.urlencoded({ extended: true }));

module.exports = app;
