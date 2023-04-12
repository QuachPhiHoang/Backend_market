//create token and saving for cookie

const { request, response } = require("express");
const http = require("http");

const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();
  const accessToken = token.accessToken;
  const refreshToken = token.refreshToken;
  //option for cookie
  const options = {
    httpOnly: true,
    // secure: true, //https
    // sameSite: "None", //cross-site cookie
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
  };
  return res.status(statusCode).cookie("token", refreshToken, options).json({
    success: true,
    user,
    accessToken,
  });
};

module.exports = sendToken;
