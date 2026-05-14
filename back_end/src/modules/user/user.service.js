const { User } = require("../../models");
const { listResources, getResourceById } = require("../resource/resource.service");

const VALID_ROLES = new Set(["admin", "staff", "customer"]);

const getUsers = async (query) => listResources(User, query);

const getUserById = async (id) => getResourceById(User, id);

const updateUserRole = async (userId, role) => {
  if (!VALID_ROLES.has(role)) {
    const error = new Error("Invalid role");
    error.statusCode = 400;
    throw error;
  }

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
