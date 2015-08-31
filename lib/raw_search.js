module.exports = function (query, searchOptions, callback) {
  var self = this;

  if (arguments.length === 2 && typeof (searchOptions) === 'function') {
    callback = searchOptions;
    searchOptions = {};
  }

  if (typeof (callback) !== 'function') {
    throw new Error('Callback not defined.');
  }

  var search = {
    index: searchOptions.index || (self._options.elastic.index || '_all'),
    type: searchOptions.type || self._options.elastic.type,
    body: _.cloneDeep(rawSearch)
  };

  if (!search.type) {
    delete search.type;
  }

  search.body.query = query;
  search.body.size = searchOptions.pagesize || rawSearch.size;

  if (searchOptions.result_fields) {
    search.body.fields = searchOptions.result_fields;
  }

  if (searchOptions.pagenum) {
    search.body.from = (Number(searchOptions.pagenum || 1) - 1) * search.body.size;
  }

  if (searchOptions.facets) {
    search.body.facets = searchOptions.facets;
  }

  if (Array.isArray(searchOptions.sort)) {
    search.body.sort = searchOptions.sort;
  }

  self.elastic.search(search, function (err, data) {
    if (err) {
      callback(err);
      return;
    }

    callback(err, {
      took: data.took,
      query: search,
      total: data.hits.total,
      results: _.map(data.hits.hits, function (h) {
        var r = {
          __meta: _.omit(h, 'fields')
        };

        _.each(h.fields, function (v, k) {
          r[k] = Array.isArray(v) && v.length === 1 ? v[0] : v;
        });

        return r;
      }),
      facets: data.facets
    });
  });

};
