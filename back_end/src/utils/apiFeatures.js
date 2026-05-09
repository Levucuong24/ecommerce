class ApiFeatures {
  constructor(query, queryString = {}) {
    this.query = query;
    this.queryString = queryString;
  }

  search(searchableFields = []) {
    const keyword = this.queryString.keyword?.trim();

    if (keyword && searchableFields.length > 0) {
      this.query = this.query.find({
        $or: searchableFields.map((field) => ({
          [field]: { $regex: keyword, $options: "i" },
        })),
      });
    }

    return this;
  }

  sort() {
    const sortBy = this.queryString.sortBy || "-createdAt";
    this.query = this.query.sort(sortBy.split(",").join(" "));
    return this;
  }

  limitFields() {
    const fields = this.queryString.fields;

    if (fields) {
      this.query = this.query.select(fields.split(",").join(" "));
    }

    return this;
  }

  paginate({ page, limit, skip }) {
    this.query = this.query.skip(skip).limit(limit);
    this.pagination = { page, limit, skip };
    return this;
  }

  getFilter() {
    return this.query.getFilter();
  }
}

module.exports = ApiFeatures;
