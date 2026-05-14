const asyncHandler = require("../../middleware/asyncHandler");
const resourceService = require("./resource.service");

const createListHandler = (Model) =>
  asyncHandler(async (req, res) => {
    const data = await resourceService.listResources(Model, req.query);
    res.json(data);
  });

const createDetailHandler = (Model) =>
  asyncHandler(async (req, res) => {
    const data = await resourceService.getResourceById(Model, req.params.id);
    res.json(data);
  });

const createResourceHandler = (Model) =>
  asyncHandler(async (req, res) => {
    const data = await resourceService.createResource(Model, req.body);
    res.status(201).json(data);
  });

module.exports = {
  createListHandler,
  createDetailHandler,
  createResourceHandler,
};
