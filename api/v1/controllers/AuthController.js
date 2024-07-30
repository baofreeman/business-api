const UserModal = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  sendEmailVerificationOTP,
} = require("../utils/auth/sendEmailVerificationOTP");
const EmailVerification = require("../models/EmailVerification");
const { generateToken } = require("../utils/auth/generateToken");
const { setTokenCookies } = require("../utils/auth/setTokenCookies");
const { refreshAccessToken } = require("../utils/auth/refreshAccessToken");
const UserRefreshToken = require("../models/UserRefreshToken");
const transporter = require("../config/emailConfig");

class AuthController {
  // POST /v1/auth/register
  async register(req, res, next) {
    try {
      const { username, email, password, password_confirmation } = req.body;
      if (!username || !email || !password || !password_confirmation) {
        return res.status(400).json({ message: "Không có dữ liệu" });
      }

      if (password !== password_confirmation) {
        return res.status(400).json({
          status: "failed",
          message: "Mật khẩu không khớp",
        });
      }

      const duplicate = await UserModal.findOne({ email })
        .collation({ locale: "en", strength: 2 })
        .lean()
        .exec();
      if (duplicate) {
        return res.status(400).json({ message: "Tên đăng nhập đã có" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await new UserModal({
        username,
        email,
        password: hashedPassword,
      }).save();
      sendEmailVerificationOTP(req, newUser);

      if (newUser) {
        return res.status(200).json({ message: `${email} tạo thành công` });
      } else {
        return res.status(400).json({ message: "Lỗi dữ liệu" });
      }
    } catch (error) {
      res.status(500).json({
        status: "failed",
        message: "Không thể đăng ký, xin thử lại sau",
      });
    }
  }

  // POST /v1/auth/verify-email
  async verifyEmail(req, res) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res
          .status(400)
          .json({ status: "failed", message: "All fields are required" });
      }
      const existingUser = await UserModal.findOne({ email });
      if (!existingUser) {
        return res
          .status(404)
          .json({ status: "failed", message: "Email doesn't exists" });
      }

      if (existingUser.is_verified) {
        return res
          .status(400)
          .json({ status: "failed", message: "Email is already verified" });
      }

      const emailVerification = await EmailVerification.findOne({
        userId: existingUser._id,
        otp,
      });
      if (!emailVerification) {
        if (!existingUser.is_verified) {
          await sendEmailVerificationOTP(req, existingUser);
          return res.status(400).json({
            status: "failed",
            message: "Invalid OTP, new OTP send to your email",
          });
        }

        return res
          .status(400)
          .json({ status: "failed", message: "Invalid OTP" });
      }

      // If OTP is epirexed
      const currentTime = new Date();
      const expirationTime = new Date(
        emailVerification.createAt.getTime() + 15 * 60 * 1000
      );
      if (currentTime > expirationTime) {
        await sendEmailVerificationOTP(req, existingUser);
        return res.status(400).json({
          status: "failed",
          message: "OTP expired, new OTP send to your email",
        });
      }

      // OTP not valid and not expired, mark as email verified
      existingUser.is_verified = true;
      await existingUser.save();

      // Delete email verification document
      await EmailVerification.deleteMany({ userId: existingUser._id });
      return res
        .status(200)
        .json({ status: "success", message: "Email verified successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: "failed",
        message: "Unable to Register, please try again later",
      });
    }
  }

  // POST /v1/auth/login
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Check username and password.
      if (!email || !password) {
        return res.status(401).json({ message: "Nhập tài khoản và mật khẩu" });
      }

      // Check user active
      const user = await UserModal.findOne({ email }).exec();
      if (!user) {
        return res.status(401).json({ message: "Không tìm thấy tài khoản" });
      }

      if (!user.is_verified) {
        return res
          .status(401)
          .json({ status: "failed", message: "Your account is not verified" });
      }

      // Check math password with bcrypt.
      const match = await bcrypt.compare(password, user.password);
      if (!match)
        return res
          .status(401)
          .json({ message: "Tài khoản hoặc mật khẩu không đúng" });

      const { accessToken, accessTokenExp, refreshToken, refreshTokenExp } =
        await generateToken(user);

      setTokenCookies(
        res,
        accessToken,
        refreshToken,
        accessTokenExp,
        refreshTokenExp
      );
      // Send success response with token
      res.status(200).json({
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          roles: user.roles[0],
        },
        status: "success",
        message: "Login successfully",
        access_token: accessToken,
        refresh_token: refreshToken,
        access_token_exp: accessTokenExp,
        is_auth: true,
      });
    } catch (error) {
      res.status(500).json({
        status: "failed",
        message: "Unable to Register, please try again later",
      });
    }
  }

  // POST /v1/auth/refresh-token
  async getNewAccessToken(req, res) {
    try {
      const {
        newAccessToken,
        newRefreshToken,
        newAccessTokenExp,
        newRefreshTokenExp,
      } = await refreshAccessToken(req, res);

      // Set New tokens to Cookie
      setTokenCookies(
        res,
        newAccessToken,
        newRefreshToken,
        newAccessTokenExp,
        newRefreshTokenExp
      );

      res.status(200).send({
        status: "success",
        message: "New tokens generated",
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        access_token_exp: newAccessTokenExp,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ status: "failed", message: "Internal server error" });
    }
  }

  // GET /v1/auth/me
  async userProfile(req, res) {
    res.send({ user: req.user });
  }

  // POST /v1/auth/change-password
  async changePassword(req, res) {
    try {
      const { password, password_confirmation } = req.body;
      if (!password || !password_confirmation) {
        return res
          .status(400)
          .json({ status: "failed", message: "Password is required" });
      }

      if (password !== password_confirmation) {
        return res.status(400).json({
          status: "failed",
          message: "Password and confirm password don't matched",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const newPassword = await bcrypt.hash(password, salt);
      await UserModal.findOneAndUpdate(req.user._id, {
        $set: {
          password: newPassword,
        },
      });

      return res
        .status(200)
        .json({ status: "success", message: "Password changed successfuly" });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: "failed",
        message: "Unable to change password, please try again later",
      });
    }
  }

  // POST /v1/auth/reset-password-link
  async sendUserPasswordResetEmail(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res
          .status(400)
          .json({ status: "failed", message: "Email is required" });
      }

      const user = await UserModal.findOne({ email });
      if (!user) {
        return res
          .status(404)
          .json({ status: "failed", message: "Email doesn't exsit" });
      }

      // Generate token for password reset
      const secret = user._id + process.env.JWT_ACCESS_TOKEN_SECRET_KEY;
      const token = jwt.sign({ userId: user._id }, secret, {
        expiresIn: "15m",
      });

      // reset Link
      const resetLink = `${process.env.CLIENT_URL}/account/reset-password-confirm/${user._id}/${token}`;
      await transporter.sendMail({
        form: process.env.EMAIL_FROM,
        to: user.email,
        subject: "Password Reset Link",
        html: `<p>Hello ${user.username}</p><p>Please <a href="${resetLink}">click here</a> to reset your password</p>`,
      });

      return res.status(200).json({
        status: "success",
        message: "Password reset email send. Please check your email",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "failed",
        message: "Unable to send Email, please try again later",
      });
    }
  }

  // POST /v1/auth/reset-password-confirm
  async userPasswordReset(req, res) {
    try {
      const { password, password_confirmation } = req.body;
      const { id, token } = req.params;

      // Find user by ID
      const user = await UserModal.findById(id);
      if (!user) {
        return res
          .status(404)
          .json({ status: "failed", message: "User not found" });
      }

      // Validate token
      const new_secret = user._id + process.env.JWT_ACCESS_TOKEN_SECRET_KEY;
      jwt.verify(token, new_secret);

      // Check password
      if (!password || !password_confirmation) {
        return res
          .status(400)
          .json({ status: "failed", message: "Password is required" });
      }

      // Check if password and confirm password match
      if (password !== password_confirmation) {
        return res.status(400).json({
          status: "failed",
          message: "Password and confirm password don't matched",
        });
      }

      // Generate salt and hash new password
      const salt = await bcrypt.genSalt(10);
      const newPassword = await bcrypt.hash(password, salt);

      await UserModal.findByIdAndUpdate(user._id, {
        $set: { password: newPassword },
      });

      return res.status(200).json({
        status: "success",
        message: "Password reset successfully",
      });
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(400).json({
          status: "failed",
          message: "Token expired, please request a new password reset link",
        });
      }
      return res.status(500).json({
        status: "failed",
        message: "Unable to reset password, please try a again later",
      });
    }
  }

  // POST /v1/auth/logout
  async logout(req, res) {
    try {
      // Optionally you can blacklist the refresh token in the database
      const refreshToken = req.cookies.refreshToken;
      await UserRefreshToken.findOneAndUpdate(
        {
          token: refreshToken,
        },
        { $set: { blacklisted: true } }
      );
      // Clear access token and refresh token cookies
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.clearCookie("is_auth");

      res
        .status(200)
        .json({ status: "success", message: "Logout successfuly" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "failed",
        message: "Unable to logout, please try again later",
      });
    }
  }
}

module.exports = new AuthController();
