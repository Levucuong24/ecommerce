const asyncHandler = require("../../middleware/asyncHandler");
const userService = require("../../services/user/user.service");

const listUsers = asyncHandler(async (req, res) => {
    const data = await userService.getUsers(req.query);
    res.json(data);
});

const getUserDetail = asyncHandler(async (req, res) => {
    const data = await userService.getUserById(req.params.id);
    res.json(data);
});

module.exports = {
  getUsers: listUsers,
  getUserById: getUserDetail,
};
