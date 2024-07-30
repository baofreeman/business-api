const transporter = require("../../config/emailConfig");
const EmailVerification = require("../../models/EmailVerification");

const sendEmailVerificationOTP = async (req, user) => {
  const otp = Math.floor(1000 + Math.random() * 9000);
  await new EmailVerification({ userId: user?._id, otp: otp }).save();
  const otpVerificationLink = `${process.env.CLIENT_URL}/account/verify-email`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "OTP - Verify your account",
    html: `<p>Dear ${user.username}</p><p>OTP- ${otpVerificationLink}</p><h2>OTP: ${otp}</h2>`,
  });

  return otp;
};

module.exports = { sendEmailVerificationOTP };
