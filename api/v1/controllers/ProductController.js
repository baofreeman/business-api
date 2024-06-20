const { default: mongoose, model } = require("mongoose");
const Products = require("../models/product");
const cloudinary = require("../config/cloudinary");
const cloudinaryImageUploadMethod = require("../middleware/cloudinaryMethod");

class ProductController {
  // GET /v1/product
  async getProducts(req, res, next) {
    const products = await Products.find().exec();
    if (!products) {
      return res.status(400).json({ message: "Không có dữ liệu" });
    }
    return res.status(200).json(products);
  }

  // POST /v1/product
  async createProduct(req, res, next) {
    const { name, description, category, subCategory } = req.body;

    if (!name || !description || !category || !subCategory) {
      return res.status(401).json({ message: "Không có dữ liệu" });
    }
    const newProduct = new Products({
      ...req.body,
      subCategory: JSON.parse(subCategory),
    });

    const urls = [];
    const files = req.files;
    for (const file of files) {
      const { path } = file;
      const newPath = await cloudinaryImageUploadMethod(
        path,
        `products/${req.body.name}`
      );
      urls.push(newPath);
    }
    newProduct.productImg = urls;

    const saveProduct = await Products.create(newProduct);
    if (saveProduct) {
      return res
        .status(200)
        .json({ message: `${name} đã được tạo thành công` });
    } else {
      return res.status(401).json({ message: "Dữ liệu không chính xác" });
    }
  }

  // PATCH /v1/product
  async updateProduct(req, res, next) {
    const { id, name, description, category } = req.body;
    if (!id || !name || !description || !category) {
      return res.status(401).json({ message: "Không có dữ liệu" });
    }
    const product = await Products.findOneAndUpdate({ _id: id }, req.body);
    if (product) {
      return res
        .status(200)
        .json({ message: `${name} đã cập nhật thành công` });
    } else {
      return res.status(401).json({ message: "Không thể cập nhật" });
    }
  }

  // DELETE /v1/product
  async deleteProduct(req, res, next) {
    const { productId } = req.body;
    console.log(req.body);
    if (!productId) {
      return res.status(401).json({ message: "Không có dữ liệu" });
    }

    const product = await Products.findOne({ _id: productId });
    const pathImgId = product.productImg.flatMap(({ id }) => id);

    // Delete image cloundinary
    const deleteImg = await Promise.all([
      await cloudinary.api.delete_resources(pathImgId, (err) => {
        if (err)
          return res.status(401).json({ message: "Hình ảnh không thể xóa" });
      }),
      await cloudinary.api.delete_folder(`products/${product.name}`, (err) => {
        if (err)
          return res.status(401).json({ message: "Thư mục không thể xóa" });
      }),
    ]);

    // Delete item mongodb
    const deleteProduct = await Products.deleteOne({ _id: productId });

    if (deleteImg && deleteProduct) {
      return res
        .status(200)
        .json({ message: `${product.name} đã xóa thành công` });
    } else {
      return res.status(401).json({ message: "Dữ liệu không thể xóa" });
    }
  }

  // GET v1/product/:itemId
  async getProduct(req, res, next) {
    const { itemId } = req.params;
    const { productId } = req.body;
    if (!itemId) {
      return res.status(400).json({ message: "Không có dữ liệu" });
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
        return res.status(401).json({ message: "Không có dữ liệu" });
      }
    }
  }

  // GET v1/product/traits/:productId
  async getFilterProducts(req, res, next) {
    const { category, tag, color, size } = req.query;

    if (!category && !tag && !color && !size) {
      let products = await Products.find();
      if (products) {
        return res.status(200).json(products);
      } else {
        return res.status(400).json({ message: "no product" });
      }
    }
    /////////////////////////////////// category
    if (category && !tag && !color && !size) {
      const products = await Products.find({ category: category });
      if (!products) {
        return res.status(400).json({ message: "No Category" });
      } else {
        return res.status(200).json(products);
      }
    }

    if (category && tag && !color && !size) {
      const products = await Products.find({
        category: category,
        "subCategory.tag": tag,
      });
      if (!products) {
        return res.status(400).json({ message: "No category and tag" });
      } else {
        return res.status(200).json(products);
      }
    }

    /////////////////////////////////// tag
    if (!category && tag && !color && !size) {
      const products = await Products.find({ "subCategory.tag": tag });
      if (!products) {
        return res.status(400).json({ message: "No Tag" });
      } else {
        return res.status(200).json(products);
      }
    }

    if (category && tag && !color && !size) {
      const products = await Products.find({
        category: category,
        "subCategory.tag": tag,
      });
      if (!products) {
        return res.status(400).json({ message: "No Color" });
      } else {
        return res.status(200).json(products);
      }
    }

    if (category && !tag && color && size) {
      const products = await Products.find({
        category: category,
        "subCategory.model.color": color,
        "subCategory.model.skus.size": size,
      });
      if (!products) {
        return res.status(400).json({ message: "No tag and Color" });
      } else {
        return res.status(200).json(products);
      }
    }

    /////////////////////////////////// color
    if (!category && !tag && color && !size) {
      const products = await Products.find({
        "subCategory.model.color": color,
      });
      if (!products) {
        return res.status(400).json({ message: "No color" });
      } else {
        return res.status(200).json(products);
      }
    }

    if (!category && tag && color && !size) {
      const products = await Products.find({
        "subCategory.tag": tag,
        "subCategory.model.color": color,
      });
      if (!products) {
        return res.status(400).json({ message: "No tag and size" });
      } else {
        return res.status(200).json(products);
      }
    }

    if (category && !tag && color && !size) {
      const products = await Products.find({
        category: category,
        "subCategory.model.color": color,
      });
      if (!products) {
        return res.status(400).json({ message: "No tag and size" });
      } else {
        return res.status(200).json(products);
      }
    }

    if (category && tag && color && !size) {
      const products = await Products.find({
        category: category,
        "subCategory.tag": tag,
        "subCategory.model.color": color,
      });
      if (!products) {
        return res.status(400).json({ message: "No color" });
      } else {
        return res.status(200).json(products);
      }
    }

    /////////////////////////////////// size

    if (!category && !tag && !color && size) {
      const products = await Products.find({
        "subCategory.model.skus.size": size,
      });
      if (!products) {
        return res.status(400).json({ message: "No size" });
      } else {
        return res.status(200).json(products);
      }
    }
    if (!category && !tag && color && size) {
      const products = await Products.find({
        "subCategory.model.color": color,
        "subCategory.model.skus.size": size,
      });
      if (!products) {
        return res.status(400).json({ message: "No size" });
      } else {
        return res.status(200).json(products);
      }
    }
    if (!category && tag && color && size) {
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

    if (category && tag && color && size) {
      const products = await Products.find({
        category: category,
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

  // GET v1/product/search/:key
  async searchProduct(req, res) {
    if (req.params.key) {
      let result = await Products.find({
        $or: [{ name: { $regex: req.params.key } }],
      });
      return res.send(result);
    } else {
      return res.status(401).json({ message: "Không có dữ liệu" });
    }
  }
}

module.exports = new ProductController();
