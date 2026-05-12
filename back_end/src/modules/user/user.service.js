const { User } = require("../../models");
const { listResources, getResourceById } = require("../resource/resource.service");

const getUsers = async (query) => listResources(User, query);

const getUserById = async (id) => getResourceById(User, id);

const updateUserRole = async (userId, role) => {
  const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return user;
};

module.exports = {
  getUsers,
  getUserById,
  updateUserRole,
};
