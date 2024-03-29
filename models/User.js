const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: validator.isEmail,
    },
    avatar: { public_id: { type: String }, url: { type: String } },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    role: { type: String, default: "user" },
    resetPasswordToken: String,
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.pre("findByIdAndUpdate", async function (next) {
  this.options.runValidators = true;
  next();
});

//COMPARE PASSWORD

UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//JWT TOKEN
UserSchema.methods.getJWTToken = function () {
  const accessToken = jwt.sign(
    {
      id: this.id,
      isAdmin: this.isAdmin,
    },
    process.env.JWT_SEC,
    {
      expiresIn: process.env.JWT_EXPIRES,
    }
  );
  const refreshToken = jwt.sign({ id: this.id }, process.env.JWT_REFRESH_SEC, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES,
  });
  return { accessToken, refreshToken };
};

// // Generating Password Reset Token

UserSchema.methods.getResetPasswordAndToken = function () {
  //Generating token
  const resetToken = crypto.randomBytes(20).toString("hex");

  //hashing and adding resetPasswordToken to userSchema

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  return resetToken;
};

module.exports = mongoose.model("User", UserSchema);
