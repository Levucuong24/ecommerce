const asyncHandler = require("../../middleware/asyncHandler");
const userService = require("./user.service");

const listUsers = asyncHandler(async (req, res) => {
    const data = await userService.getUsers(req.query);
    res.json(data);
});

const getUserDetail = asyncHandler(async (req, res) => {
    const data = await userService.getUserById(req.params.id);
    res.json(data);
});

const updateRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const data = await userService.updateUserRole(req.params.id, role);
    res.json(data);
});

module.exports = {
  getUsers: listUsers,
  getUserById: getUserDetail,
  updateRole,
};
