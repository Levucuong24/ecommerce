const mongoose = require("mongoose");
const ApiFeatures = require("../utils/apiFeatures");
const {
  buildPagination,
  buildPaginationMeta,
} = require("../utils/pagination");

const listResources = async (Model, query = {}) => {
  const { limit, page, skip } = buildPagination(query);
  const features = new ApiFeatures(Model.find(), query)
    .search(["name", "title", "code", "email"])
    .sort()
    .limitFields()
    .paginate({ page, limit, skip });

  const filter = features.getFilter();
  const [items, total] = await Promise.all([
    features.query,
    Model.countDocuments(filter),
  ]);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

const getResourceById = async (Model, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid resource id");
    error.statusCode = 400;
    throw error;
  }

  const item = await Model.findById(id);

  if (!item) {
    const error = new Error("Resource not found");
    error.statusCode = 404;
    throw error;
  }

  return item;
};

module.exports = {
  listResources,
  getResourceById,
};
