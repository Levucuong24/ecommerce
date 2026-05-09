const { Product } = require("../models");
const { listResources, getResourceById } = require("./resource.service");

const getProducts = async (query) => listResources(Product, query);

const getProductById = async (id) => getResourceById(Product, id);

module.exports = {
  getProducts,
  getProductById,
};
