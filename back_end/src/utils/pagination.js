const buildPagination = (query = {}) => {
  const limit = Math.min(Number(query.limit) || 50, 100);
  const page = Math.max(Number(query.page) || 1, 1);
  const skip = (page - 1) * limit;

  return {
    limit,
    page,
    skip,
  };
};

const buildPaginationMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(Math.ceil(total / limit), 1),
});

module.exports = {
  buildPagination,
  buildPaginationMeta,
};
