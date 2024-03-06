const Users = require("../models/user");
const bcrypt = require("bcrypt");

class UserController {
  async getUsers(req, res, next) {
    const users = await Users.find().select("-password").lean();
    if (!users.length) {
      return res.status(400).json({ message: "Users not found" });
    }
    res.status(200).json(users);
  }

  async createUser(req, res, next) {
    const { username, password, roles } = req.body;
    if (!username || !password || !Array.isArray(roles) || !roles.length) {
      return res.status(400).json({ message: "No data" });
    }

    const duplicate = await Users.findOne({ username })
      .collation({ locale: "en", strength: 2 })
      .lean()
      .exec();
    if (duplicate) {
      return res.status(400).json({ message: "Duplicate" });
    }

    const hashPwd = await bcrypt.hash(password, 10);
    const userObject = { username, password: hashPwd, roles };
    const newUser = await Users.create(userObject);
    if (newUser) {
      return res.status(200).json({ message: `${username} is create` });
    } else {
      return res.status(400).json({ message: "invalid" });
    }
  }
}

module.exports = new UserController();
