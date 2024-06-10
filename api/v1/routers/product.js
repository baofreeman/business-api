const express = require("express");
const ProductController = require("../controllers/ProductController");
const router = express.Router();
const multer = require("multer");
const verifyJWT = require("../middleware/verifyJWT");

const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, "-") + file.originalname);
  },
});
const upload = multer({ storage: storage });

router
  .route("/")
  .get(ProductController.getProducts)
  .post(upload.array("productImg"), ProductController.createProduct)
  .patch(ProductController.updateProduct);

router.route("/trait").get(ProductController.getFilterProducts);
router.route("/search/:key").get(ProductController.searchProduct);
router
  .route("/:itemId")
  .get(ProductController.getProduct)
  .delete(ProductController.deleteProduct);

module.exports = router;
