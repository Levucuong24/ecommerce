const createListHandler = (Model) => async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const data = await Model.find().limit(limit);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createListHandler,
};
