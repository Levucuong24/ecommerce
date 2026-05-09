const asyncHandler = require("../middleware/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const {
  registerUser,
  loginUser,
  getCurrentUser,
} = require("../services/authService");

const register = asyncHandler(async (req, res) => {
    const { token, user } = await registerUser(req.body);
    sendResponse(res, 201, "Register successful", { token, user });
});

const login = asyncHandler(async (req, res) => {
    const { token, user } = await loginUser(req.body);
    sendResponse(res, 200, "Login successful", { token, user });
});

const me = asyncHandler(async (req, res) => {
    const user = await getCurrentUser(req.user.userId);
    sendResponse(res, 200, "Get profile successful", { user });
});

module.exports = {
  register,
  login,
  me,
};
