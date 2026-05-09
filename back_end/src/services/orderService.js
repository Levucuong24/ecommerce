const { Order } = require("../models");
const { listResources, getResourceById } = require("./resource.service");

const getOrders = async (query) => listResources(Order, query);

const getOrderById = async (id) => getResourceById(Order, id);

module.exports = {
  getOrders,
  getOrderById,
};
