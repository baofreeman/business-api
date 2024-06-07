const express = require("express");
const UserController = require("../controllers/UserController");
const router = express.Router();

router
  .route("/")
  .get(UserController.getUsers)
  .post(UserController.createUser)
  .delete(UserController.deleteUser);

module.exports = router;
