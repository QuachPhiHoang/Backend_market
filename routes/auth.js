const router = require("express").Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const sendToken = require("../util/jwToken");
const sendEmail = require("../util/sendEmail");
const crypto = require("crypto");
const cloudinary = require("cloudinary");

const {
  verifyToken,
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
} = require("./verifyToken");
//REGISTER

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const myCloud = await cloudinary.v2.uploader.upload_large(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    const newUser = await User.create({
      username,
      email,
      password,
      avatar: {
        public_id: myCloud?.public_id,
        url: myCloud?.secure_url,
      },
    });
    sendToken(newUser, 201, res);
  } catch (err) {
    console.log(err);
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

// REFRESH TOKEN

router.get("/refresh", async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.token)
      return res.status(401).json({ message: "Unauthorized" });
    const refreshToken = cookies.token;
    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SEC,
      async (error, decode) => {
        if (error) return res.status(401).json({ message: "Forbidden" });
        const user = await User.findById({ _id: decode.id }).exec();
        if (!user) return res.status(401).json({ message: "Unauthorized" });
        const accessToken = jwt.sign(
          {
            id: user.id,
            isAdmin: user.isAdmin,
          },
          process.env.JWT_SEC,
          {
            expiresIn: process.env.JWT_EXPIRES,
          }
        );
        return res.json({ accessToken });
      }
    );
  } catch (error) {
    return res.status(500).json(error);
  }
});

//LOGOUT
router.get("/logout", async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.token) return res.sendStatus(204);
    res.clearCookie("token", {
      expires: new Date(Date.now()),
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });
    res.status(200).json({
      success: true,
      message: "Logout",
    });
  } catch (err) {
    res.status(500).json(err);
  }
});
//Get User Detail
router.get("/me", verifyToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const user = await User.findById(req.user.id);
    sendToken(user, 200, res);
    // return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error });
  }
});

//FORGOT PASSWORD

router.post("/password/forgot", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json("User not found!");
  }
  const resetToken = user.getResetPasswordAndToken();
  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

  const message = `Your password reset token is temp :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this username then, please ignore it`;

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
    return res.status(400).json("User not found!");
  }
  if (req.body.password !== req.body.confirmPassword) {
    return res.status(400).json("Password does not match");
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  await user.save();
  sendToken(user, 200, res);
});

//CHANGE PASSWORD

router.put("/update/password", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(400).json("User not found!");
    }

    const isMatchedPassword = await user.comparePassword(req.body.oldPassword);

    if (!isMatchedPassword) {
      return res.status(400).json("Password old does not match");
    }

    if (req.body.newPassword !== req.body.confirmNewPassword) {
      return res.status(400).json("Password new does not match");
    }
    user.password = req.body.newPassword;
    await user.save();
    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    return res.status(500).json(error);
  }
});
// UPDATE PROFILE

router.put("/update/profile", verifyToken, async (req, res) => {
  try {
    const newUser = {
      username: req.body.username,
      email: req.body.email,
    };
    if (req.body.avatar !== "") {
      const user = await User.findById(req.user.id);

      const imageId = user.avatar.public_id;

      await cloudinary.v2.uploader.destroy(imageId);

      const myCloud = await cloudinary.v2.uploader.upload_large(
        req.body.avatar,
        {
          folder: "avatars",
          width: 150,
          crop: "scale",
        }
      );

      newUser.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }

    const user = await User.findByIdAndUpdate(req.user.id, newUser, {
      new: true,
      runValidators: true,
      userFindAndModify: false,
    });

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    return res.status(500).json(error);
  }
});

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
