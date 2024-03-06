const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  active: { type: Boolean, default: true },
  roles: [{ type: String, default: "Custommer" }],
});

module.exports = mongoose.model("User", UserSchema);
