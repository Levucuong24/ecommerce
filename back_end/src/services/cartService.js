const { Cart } = require("../models");
const { listResources, getResourceById } = require("./resource.service");

const getCarts = async (query) => listResources(Cart, query);

const getCartById = async (id) => getResourceById(Cart, id);

module.exports = {
  getCarts,
  getCartById,
};
