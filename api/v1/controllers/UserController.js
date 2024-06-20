const Users = require("../models/user");
const bcrypt = require("bcrypt");

class UserController {
  // GET path: /v1/user
  async getUsers(req, res, next) {
    const users = await Users.find().select("-password").lean();
    if (!users.length) {
      return res.status(400).json({ message: "Không tìm thấy dữ liệu" });
    }
    res.status(200).json(users);
  }

  // POST path: /v1/user
  async createUser(req, res, next) {
    const { username, password, roles } = req.body;
    if (!username || !password || !Array.isArray(roles) || !roles.length) {
      return res.status(400).json({ message: "Không có dữ liệu" });
    }

    const duplicate = await Users.findOne({ username })
      .collation({ locale: "en", strength: 2 })
      .lean()
      .exec();
    if (duplicate) {
      return res.status(400).json({ message: "Tên đăng nhập đã có" });
    }

    const hashPwd = await bcrypt.hash(password, 10);
    const userObject = { username, password: hashPwd, roles };
    const newUser = await Users.create(userObject);
    if (newUser) {
      return res.status(200).json({ message: `${username} tạo thành công` });
    } else {
      return res.status(400).json({ message: "Lỗi dữ liệu" });
    }
  }

  // DELETE path: /v1/user
  async deleteUser(req, res, next) {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId bắt buộc" });
    }
    const user = await Users.findById({ _id: userId }).exec();
    if (!user) {
      return res.status(400).json({ message: "Không tìm thấy người dùng" });
    }

    // Delete User
    await user.deleteOne();
    res.json({
      message: `Username ${user.username} với Id ${user._id} đã được xóa`,
    });
  }
}

module.exports = new UserController();
