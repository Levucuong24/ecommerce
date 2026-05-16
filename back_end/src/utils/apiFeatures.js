class ApiFeatures {
  constructor(query, queryString = {}) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields", "keyword", "sortBy"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
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

  populate(populateOptions) {
    if (populateOptions) {
      this.query = this.query.populate(populateOptions);
    }
    return this;
  }

  getFilter() {
    return this.query.getFilter();
  }
}

module.exports = ApiFeatures;
