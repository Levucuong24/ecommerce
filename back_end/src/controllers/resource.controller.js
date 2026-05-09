const asyncHandler = require("../middleware/asyncHandler");
const { listResources, getResourceById } = require("../services/resource.service");

const createListHandler = (Model) =>
  asyncHandler(async (req, res) => {
    const data = await listResources(Model, req.query);
    res.json(data);
  });

const createDetailHandler = (Model) =>
  asyncHandler(async (req, res) => {
    const data = await getResourceById(Model, req.params.id);
    res.json(data);
  });

module.exports = {
  createListHandler,
  createDetailHandler,
};
