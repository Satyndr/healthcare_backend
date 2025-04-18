const User = require("../models/User.js");
const ErrorResponse = require("../utils/ErrorResponse.js");
const jwt = require("jsonwebtoken");

// POST /api/v1/auth/register

exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log("Email: ", email);
    console.log("Pass: ", password);
    // Create user
    const user = await User.create({
      email,
      password,
    });
    console.log("user: ", user);

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

//  POST /api/v1/auth/login
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password", 400));
  }

  try {
    // Check for user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorResponse("Invalid credentials", 401));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return next(new ErrorResponse("Invalid credentials", 401));
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

//  GET /api/v1/auth/me
exports.getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.status(statusCode).json({
    success: true,
    token,
  });
};
