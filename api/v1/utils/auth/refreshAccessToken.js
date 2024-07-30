const UserModal = require("../../models/User");
const UserRefreshTokenModal = require("../../models/UserRefreshToken");
const { generateToken } = require("./generateToken");
const { verifyRefreshToken } = require("./verifyRefreshToken");

const refreshAccessToken = async (req, res) => {
  try {
    const oldRefreshToken = req.cookies.refreshToken;
    // Verify Refresh Token is valid or not
    const { tokenDetails, error } = await verifyRefreshToken(oldRefreshToken);
    if (error) {
      return res
        .status(401)
        .send({ status: "failed", message: "Invalid refresh token" });
    }
    // Find User based on Refresh Token detail id
    const user = await UserModal.findById(tokenDetails._id);

    if (!user) {
      return res
        .status(404)
        .send({ status: "failed", message: "User not found" });
    }

    const userRefreshToken = await UserRefreshTokenModal.findOne({
      userId: tokenDetails._id,
    });

    if (
      oldRefreshToken !== userRefreshToken.token ||
      userRefreshToken.blacklisted
    ) {
      return res
        .status(401)
        .send({ status: "failed", message: "Unauthorized access" });
    }

    // Generate new access and refresh tokens
    const { accessToken, refreshToken, accessTokenExp, refreshTokenExp } =
      await generateToken(user);
    return {
      newAccessToken: accessToken,
      newRefreshToken: refreshToken,
      newAccessTokenExp: accessTokenExp,
      newRefreshTokenExp: refreshTokenExp,
    };
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ status: "failed", message: "Internal server error" });
  }
};

module.exports = { refreshAccessToken };
