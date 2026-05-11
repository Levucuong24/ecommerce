const asyncHandler = require("../../middleware/asyncHandler");
const sendResponse = require("../../utils/sendResponse");
const authService = require("../../services/auth/auth.service");

const register = asyncHandler(async (req, res) => {
    const { token, user } = await authService.registerUser(req.body);
    sendResponse(res, 201, "Register successful", { token, user });
});

const login = asyncHandler(async (req, res) => {
    const { token, user } = await authService.loginUser(req.body);
    sendResponse(res, 200, "Login successful", { token, user });
});

const me = asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.user.userId);
    sendResponse(res, 200, "Get profile successful", { user });
});

const forgotPassword = asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(req.body.email);
    sendResponse(res, 200, "Password reset OTP generated", result);
});

const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    await authService.resetPassword(email, otp, newPassword);
    sendResponse(res, 200, "Password reset successfully", null);
});

module.exports = {
  register,
  login,
  me,
  forgotPassword,
  resetPassword,
};
