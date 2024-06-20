const Users = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

class AuthController {
  // Login
  async login(req, res, next) {
    const { username, password } = req.body;

    // Check username and password.
    if (!username || !password) {
      return res.status(401).json({ message: "Nhập tài khoản và mật khẩu" });
    }

    // Check user active
    const foundUser = await Users.findOne({ username }).exec();
    if (!foundUser || !foundUser.active) {
      return res.status(401).json({ message: "Không tìm thấy tài khoản" });
    }

    // Check math password with bcrypt.
    const match = await bcrypt.compare(password, foundUser.password);
    if (!match)
      return res
        .status(401)
        .json({ message: "Tài khoản hoặc mật khẩu không đúng" });

    // Create accessToken.
    const accessToken = jwt.sign(
      {
        UserInfo: {
          username: foundUser.username,
          roles: foundUser.roles,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "15s",
      }
    );

    // Create refreshToken.
    const refreshToken = jwt.sign(
      {
        username: foundUser.username,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ accessToken, message: "Đăng nhập thành công" });
  }

  // Refresh Token.
  async refresh(req, res, next) {
    // GET token in cookies.
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204);
    const refreshToken = cookies.jwt;

    // Verify Token.
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) return res.status(403).json({ message: "Forbidden" });
        const foundUser = await Users.findOne({ username: decoded.username });
        if (!foundUser)
          return res.status(401).json({ message: "Không tìm thấy toài khoản" });
        const accessToken = jwt.sign(
          {
            UserInfo: {
              username: foundUser.username,
              roles: foundUser.roles,
            },
          },
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: "365d",
          }
        );
        res.json({ accessToken });
      }
    );
  }

  // Logout.
  async logout(req, res) {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204);
    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
    res.json({ message: "Cookie cleared" });
  }
}

module.exports = new AuthController();
