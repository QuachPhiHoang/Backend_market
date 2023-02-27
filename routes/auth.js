const router = require("express").Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const sendToken = require("../util/jwToken");
const sendEmail = require("../util/sendEmail");
const crypto = require("crypto");
const cloudinary = require("cloudinary");

const {
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
} = require("./verifyToken");
//REGISTER

router.post("/register", async (req, res) => {
  try {
    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });
    const { username, email, password } = req.body;

    const newUser = await User.create({
      username,
      email,
      password,
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
    });
    sendToken(newUser, 201, res);
  } catch (err) {
    return res.status(500).json({ message: "User already registered!" });
  }
});

//LOGIN

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Please Enter Your User And Password!" });
  }
  try {
    const user = await User.findOne({ username }).select("+password").exec();

    if (!user) {
      return res.status(401).json({ message: "Wrong Info!" });
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
      return res.status(401).json({ message: "Wrong Info!" });
    }

    sendToken(user, 200, res);
  } catch (err) {
    return res.status(500).json(err);
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

//CHANGE PASSWORD

router.put(
  "/change/password/:id",
  verifyTokenAndAuthorization,
  async (req, res) => {
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      res.status(400).json("User not found!");
    }

    const isMatchedPassword = await user.comparePassword(req.body.oldPassword);

    if (!isMatchedPassword) {
      res.status(400).json("Password old does not match");
    }

    if (req.body.newPassword !== req.body.confirmNewPassword) {
      res.status(400).json("Password new does not match");
    }
    user.password = req.body.newPassword;
    await user.save();
    sendToken(user, 200, res);
  }
);
// UPDATE PROFILE

router.put(
  "/update/profile/:id",
  verifyTokenAndAuthorization,
  async (req, res) => {
    const newDataUser = {
      email: req.body.email,
    };

    //ADD cloudinary

    const user = await User.findByIdAndUpdate(req.user.id, newDataUser, {
      new: true,
      runValidators: true,
      userFindAndModify: false,
    });

    res.status(200).json({
      success: true,
    });
  }
);

// UPDATE ROLEADMIN -- ADMIN

router.put("/update/role/:id", verifyTokenAndAdmin, async (req, res) => {
  const newDataUser = {
    email: req.body.email,
    isAdmin: req.body.isAdmin,
  };

  const user = await User.findByIdAndUpdate(req.params.id, newDataUser, {
    new: true,
    runValidators: true,
    userFindAndModify: false,
  });

  if (!user) {
    return res.status(400).json("user not found!");
  }

  res.status(200).json({
    success: true,
  });
});

module.exports = router;
