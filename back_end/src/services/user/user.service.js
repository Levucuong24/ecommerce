const { User } = require("../../models");
const { listResources, getResourceById } = require("../../services/resource/resource.service");

const getUsers = async (query) => listResources(User, query);

const getUserById = async (id) => getResourceById(User, id);

module.exports = {
  getUsers,
  getUserById,
};
