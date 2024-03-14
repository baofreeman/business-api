const { default: mongoose } = require("mongoose");
const Products = require("../models/product");
const { query } = require("express");

class ProductController {
  //[path: /product]
  async getProducts(req, res, next) {
    const products = await Products.find().exec();
    if (!products) {
      return res.status(400).json({ message: "No product" });
    }
    return res.status(200).json(products);
  }

  async createProduct(req, res, next) {
    const { name, description, category, subCategory, tag } = req.body;
    if (!name || !description || !category) {
      return res.status(401).json({ message: "No data" });
    }
    const newProduct = new Products({
      ...req.body,
      subCategory: JSON.parse(subCategory),
    });
    if (!req.files) {
      return res.status(401).json({ message: "Image is require" });
    } else {
      let path = "";
      req.files.forEach((file, index, arr) => {
        path = path + file.filename + ",";
      });
      path = path.substring(0, path.lastIndexOf(","));
      path = path.split(",");
      newProduct.productImg = path;
    }
    const saveProduct = await Products.create(newProduct);
    if (saveProduct) {
      return res.status(200).json({ message: `${name} is created` });
    } else {
      return res.status(401).json({ message: "Invalid Data" });
    }
  }
  async updateProduct(req, res, next) {
    const { id, name, description, image, category, subCategory } = req.body;
    if (!id || !name || !description || !image || !category || !subCategory) {
      return res.status(401).json({ message: "No data" });
    }
    const product = await Products.findOneAndUpdate({ _id: id }, req.body);
    if (product) {
      return res.status(200).json({ message: `${name} is update` });
    } else {
      return res.status(401).json({ message: "Invalid Data" });
    }
  }
  async deleteProduct(req, res, next) {
    const { productId } = req.params;
    if (!productId) {
      return res.status(401).json({ message: "No data" });
    }
    const product = await Products.findOneAndDelete({ _id: productId });
    if (product) {
      return res.status(200).json({ message: `${product.name} is delete` });
    } else {
      return res.status(401).json({ message: "Invalid Data" });
    }
  }

  //[path: /product/:itemId]
  async getProduct(req, res, next) {
    const { itemId } = req.params;
    const { productId } = req.body;
    if (!itemId) {
      return res.status(400).json({ message: "no data" });
    } else {
      const product = await Products.aggregate([
        { $unwind: "$subCategory" },
        { $unwind: "$subCategory.model" },
        { $unwind: "$subCategory.model.skus" },
        {
          $match: {
            "subCategory.model.skus._id": new mongoose.Types.ObjectId(
              itemId || productId
            ),
          },
        },
      ]);
      if (product) {
        return res.status(200).json(product);
      } else {
        return res.status(401).json({ message: "Invalid Data" });
      }
    }
  }

  //[path: /product/traits/:productId]
  async getFilterProducts(req, res, next) {
    const { tag, color, size } = req.query;
    console.log(req.query);
    if (!tag && !color && !size) {
      let products = await Products.find();
      if (products) {
        return res.status(200).json(products);
      } else {
        return res.status(400).json({ message: "no product" });
      }
    }
    if (tag && !color && !size) {
      const products = await Products.find({ "subCategory.tag": tag });
      if (!products) {
        return res.status(400).json({ message: "No Tag" });
      } else {
        return res.status(200).json(products);
      }
    }
    if (!tag && color && !size) {
      const products = await Products.find({
        "subCategory.model.color": color,
      });
      if (!products) {
        return res.status(400).json({ message: "No Color" });
      } else {
        return res.status(200).json(products);
      }
    }

    if (tag && color && !size) {
      const products = await Products.find({
        "subCategory.tag": tag,
        "subCategory.model.color": color,
      });
      if (!products) {
        return res.status(400).json({ message: "No tag and Color" });
      } else {
        return res.status(200).json(products);
      }
    }

    if (!tag && color && size) {
      const products = await Products.find({
        "subCategory.model.color": color,
        "subCategory.model.skus.size": size,
      });
      if (!products) {
        return res.status(400).json({ message: "No color and size" });
      } else {
        return res.status(200).json(products);
      }
    }

    if (tag && !color && size) {
      const products = await Products.find({
        "subCategory.tag": tag,
        "subCategory.model.skus.size": size,
      });
      if (!products) {
        return res.status(400).json({ message: "No tag and size" });
      } else {
        return res.status(200).json(products);
      }
    }

    if (!tag && !color && size) {
      const products = await Products.find({
        "subCategory.model.skus.size": size,
      });
      if (!products) {
        return res.status(400).json({ message: "No size" });
      } else {
        return res.status(200).json(products);
      }
    }

    if (color && tag && size) {
      const products = await Products.find({
        "subCategory.tag": tag,
        "subCategory.model.color": color,
        "subCategory.model.skus.size": size,
      });
      if (!products) {
        return res.status(400).json({ message: "No size" });
      } else {
        return res.status(200).json(products);
      }
    }
  }
  async searchProduct(req, res) {
    if (req.params.key) {
      let result = await Products.find({
        $or: [{ name: { $regex: req.params.key } }],
      });
      return res.send(result);
    } else {
      return res.status(401).json({ message: "No Found" });
    }
  }
}

module.exports = new ProductController();
