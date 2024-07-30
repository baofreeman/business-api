const { default: mongoose, model } = require("mongoose");
const ProductModal = require("../models/Product");
const cloudinary = require("../config/cloudinary");
const cloudinaryImageUploadMethod = require("../middleware/cloudinaryMethod");

class ProductController {
  // GET /v1/product
  async getProducts(req, res) {
    let { page } = req.query;
    let limit = 8;
    let skip = (page - 1) * limit;

    if (page === undefined) {
      const products = await ProductModal.find();
      if (!products) {
        return res.status(400).json({ message: "Không có dữ liệu" });
      }
      return res.status(200).json(products);
    } else {
      const products = await ProductModal.find().skip(skip).limit(limit);
      if (!products) {
        return res.status(400).json({ message: "Không có dữ liệu" });
      }
      res.status(200).json(products);
    }
  }

  async getProductsCategory(req, res) {
    let { category } = req.params;
    const { page } = req.query;
    console.log(req.query);
    console.log(req.params);
    let limit = 8;
    let skip = (page - 1) * limit;

    if (page === undefined) {
      const products = await ProductModal.find();
      if (!products) {
        return res.status(400).json({ message: "Không có dữ liệu" });
      }
      return res.status(200).json(products);
    } else {
      const products = await ProductModal.find({ category })
        .skip(skip)
        .limit(limit);
      if (!products) {
        return res.status(400).json({ message: "Không có dữ liệu" });
      }
      res.status(200).json(products);
    }
  }

  // POST /v1/create-product
  async createProduct(req, res) {
    const { name, description, category, subCategory } = req.body;

    if (!name || !description || !category || !subCategory) {
      return res.status(401).json({ message: "Không có dữ liệu" });
    }
    const newProduct = new ProductModal({
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

    const saveProduct = await ProductModal.create(newProduct);
    if (saveProduct) {
      res.status(200).json({ message: `${name} đã được tạo thành công` });
    } else {
      return res.status(401).json({ message: "Dữ liệu không chính xác" });
    }
  }

  // PATCH /v1/update-product
  async updateProduct(req, res) {
    const { id, name, description, category } = req.body;
    if (!id || !name || !description || !category) {
      return res.status(401).json({ message: "Không có dữ liệu" });
    }
    const product = await ProductModal.findOneAndUpdate({ _id: id }, req.body);
    if (product) {
      return res
        .status(200)
        .json({ message: `${name} đã cập nhật thành công` });
    } else {
      return res.status(401).json({ message: "Không thể cập nhật" });
    }
  }

  // DELETE /v1/delete-product
  async deleteProduct(req, res) {
    const { productId } = req.body;
    if (!productId) {
      return res.status(401).json({ message: "Không có dữ liệu" });
    }

    const product = await ProductModal.findOne({ _id: productId });
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
    const deleteProduct = await ProductModal.deleteOne({ _id: productId });

    if (deleteImg && deleteProduct) {
      res.status(200).json({ message: `${product.name} đã xóa thành công` });
    } else {
      res.status(401).json({ message: "Dữ liệu không thể xóa" });
    }
  }

  // GET v1/product/:itemId
  async getProduct(req, res) {
    const { itemId } = req.params;
    if (!itemId) {
      return res.status(400).json({ message: "Không có dữ liệu" });
    } else {
      const product = await ProductModal.aggregate([
        { $unwind: "$subCategory" },
        { $unwind: "$subCategory.model" },
        { $unwind: "$subCategory.model.skus" },
        {
          $match: {
            "subCategory.model.skus._id": new mongoose.Types.ObjectId(itemId),
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

  // GET v1/product/traits
  async getFilterProducts(req, res) {
    const { category, tag, color, size, page } = req.query;
    let limit = 8;
    let skip = (page - 1) * limit;

    if (!category && !tag && !color && !size) {
      let products = await ProductModal.find().skip(skip).limit(limit);
      if (products) {
        return res.status(200).json(products);
      } else {
        return res.status(400).json({ message: "no product" });
      }
    }
    /////////////////////////////////// category
    if (category && !tag && !color && !size) {
      console.log(skip, limit);
      const products = await ProductModal.find({ category: category })
        .skip(skip)
        .limit(limit);

      if (!products) return res.status(400).json({ message: "No Category" });
      res.status(200).json(products);
    }

    if (category && tag && !color && !size) {
      const products = await ProductModal.find({
        category: category,
        "subCategory.tag": tag,
      })
        .skip(skip)
        .limit(limit);

      if (!products) {
        return res.status(400).json({ message: "No category and tag" });
      } else {
        return res.status(200).json(products);
      }
    }

    /////////////////////////////////// tag
    if (!category && tag && !color && !size) {
      const products = await ProductModal.find({ "subCategory.tag": tag })
        .skip(skip)
        .limit(limit);
      if (!products) {
        return res.status(400).json({ message: "No Tag" });
      } else {
        return res.status(200).json(products);
      }
    }

    if (category && tag && !color && !size) {
      const products = await ProductModal.find({
        category: category,
        "subCategory.tag": tag,
      })
        .skip(skip)
        .limit(limit);
      if (!products) {
        return res.status(400).json({ message: "No Color" });
      } else {
        return res.status(200).json(products);
      }
    }

    if (category && !tag && color && size) {
      const products = await ProductModal.find({
        category: category,
        "subCategory.model.color": color,
        "subCategory.model.skus.size": size,
      })
        .skip(skip)
        .limit(limit);
      if (!products) {
        return res.status(400).json({ message: "No tag and Color" });
      } else {
        return res.status(200).json(products);
      }
    }

    /////////////////////////////////// color
    if (!category && !tag && color && !size) {
      const products = await ProductModal.find({
        "subCategory.model.color": color,
      })
        .skip(skip)
        .limit(limit);
      if (!products) {
        return res.status(400).json({ message: "No color" });
      } else {
        return res.status(200).json(products);
      }
    }

    if (!category && tag && color && !size) {
      const products = await ProductModal.find({
        "subCategory.tag": tag,
        "subCategory.model.color": color,
      })
        .skip(skip)
        .limit(limit);
      if (!products) {
        return res.status(400).json({ message: "No tag and size" });
      } else {
        return res.status(200).json(products);
      }
    }

    if (category && !tag && color && !size) {
      const products = await ProductModal.find({
        category: category,
        "subCategory.model.color": color,
      })
        .skip(skip)
        .limit(limit);
      if (!products) {
        return res.status(400).json({ message: "No tag and size" });
      } else {
        return res.status(200).json(products);
      }
    }

    if (category && tag && color && !size) {
      const products = await ProductModal.find({
        category: category,
        "subCategory.tag": tag,
        "subCategory.model.color": color,
      })
        .skip(skip)
        .limit(limit);
      if (!products) {
        return res.status(400).json({ message: "No color" });
      } else {
        return res.status(200).json(products);
      }
    }

    /////////////////////////////////// size

    if (!category && !tag && !color && size) {
      const products = await ProductModal.find({
        "subCategory.model.skus.size": size,
      })
        .skip(skip)
        .limit(limit);
      if (!products) {
        return res.status(400).json({ message: "No size" });
      } else {
        return res.status(200).json(products);
      }
    }
    if (!category && !tag && color && size) {
      const products = await ProductModal.find({
        "subCategory.model.color": color,
        "subCategory.model.skus.size": size,
      })
        .skip(skip)
        .limit(limit);
      if (!products) {
        return res.status(400).json({ message: "No size" });
      } else {
        return res.status(200).json(products);
      }
    }
    if (!category && tag && color && size) {
      const products = await ProductModal.find({
        "subCategory.tag": tag,
        "subCategory.model.color": color,
        "subCategory.model.skus.size": size,
      })
        .skip(skip)
        .limit(limit);
      if (!products) {
        return res.status(400).json({ message: "No size" });
      } else {
        return res.status(200).json(products);
      }
    }

    if (category && tag && color && size) {
      const products = await ProductModal.find({
        category: category,
        "subCategory.tag": tag,
        "subCategory.model.color": color,
        "subCategory.model.skus.size": size,
      })
        .skip(skip)
        .limit(limit);
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
      console.log(req.params.key);
      let result = await ProductModal.find({
        $or: [{ name: { $regex: req.params.key } }],
      });
      console.log(result);
      return res.send(result);
    } else {
      res.status(401).json({ message: "Không có dữ liệu" });
    }
  }
}

module.exports = new ProductController();
