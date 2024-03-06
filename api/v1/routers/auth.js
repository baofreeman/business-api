const express = require("express");
const AuthController = require("../controllers/AuthController");
const router = express.Router();

router.route("/").post(AuthController.login);
router.route("/refresh").get(AuthController.refresh);
router.route("/logout").post(AuthController.logout);

module.exports = router;
