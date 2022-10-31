const router = require("express").Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const sendToken = require("../util/jwToken");
const sendEmail = require("../util/sendEmail");
const crypto = require("crypto");

//REGISTER

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  const newUser = await User.create({
    username,
    email,
    password,
    avatar: {
      public_id: "sample",
      url: "sample",
    },
  });

  try {
    sendToken(newUser, 201, res);
  } catch (err) {
    res.status(500).json(err);
  }
});

//LOGIN

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json("Please Enter Your User And Password!");
  }
  try {
    const user = await User.findOne({ username }).select("+password");

    !user && res.status(401).json("Wrong Info!");

    const isPasswordMatched = await user.comparePassword(password);

    !isPasswordMatched && res.status(401).json("Wrong Info!");

    sendToken(user, 200, res);
  } catch (err) {
    res.status(500).json(err);
  }
});

//LOGOUT
router.get("/logout", async (req, res) => {
  try {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });
    res.status(200).json({
      success: true,
      message: "Logout",
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

//FORGOT PASSWORD

router.post("/password/forgot", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    res.status(404).json("User not found!");
  }
  const resetToken = user.getResetPasswordAndToken();
  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/auth/password/reset/${resetToken}`;

  console.log(resetPasswordUrl);

  const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this username then, please ignore it`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Ecommerce Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email send to ${user.email} successfully`,
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500).json(err);
  }
});

//RESET PASSWORD

router.put("/password/reset/:token", async (req, res) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({ resetPasswordToken });

  if (!user) {
    res.status(400).json("User not found!");
  }
  if (req.body.password !== req.body.confirmPassword) {
    res.status(400).json("Password does not match");
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  await user.save();
  sendToken(user, 200, res);
});

module.exports = router;
