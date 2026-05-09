const asyncHandler = require("../middleware/asyncHandler");
const { getUsers, getUserById } = require("../services/userService");

const listUsers = asyncHandler(async (req, res) => {
    const data = await getUsers(req.query);
    res.json(data);
});

const getUserDetail = asyncHandler(async (req, res) => {
    const data = await getUserById(req.params.id);
    res.json(data);
});

module.exports = {
  getUsers: listUsers,
  getUserById: getUserDetail,
};
