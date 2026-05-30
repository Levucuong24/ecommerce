const asyncHandler = require("../../middleware/asyncHandler");
const sendResponse = require("../../utils/sendResponse");
const authService = require("./auth.service");
const generateToken = require("../../utils/generateToken");

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
    const token = generateToken(user);
    sendResponse(res, 200, "Get profile successful", { user, token });
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

const googleLogin = asyncHandler(async (req, res) => {
    const { credential } = req.body;
    const { token, user } = await authService.googleLogin(credential);
    sendResponse(res, 200, "Google login successful", { token, user });
});

const updateProfile = asyncHandler(async (req, res) => {
    const updatedUser = await authService.updateUserProfile(req.user.userId, req.body);
    sendResponse(res, 200, "Update profile successful", { user: updatedUser });
});

module.exports = {
  register,
  login,
  me,
  updateProfile,
  forgotPassword,
  resetPassword,
  googleLogin,
};
