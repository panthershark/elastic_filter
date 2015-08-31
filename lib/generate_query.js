var _ = require("lodash");
var templates = require("./templates.js");

module.exports = function (text, searchOptions) {
  var self = this;

  if (arguments.length === 1 && typeof (searchOptions) == "undefined") {
    searchOptions = {};
  }

  searchOptions = _.defaults(searchOptions || {}, {
    //active: true
  });

  var query;

  //make sure we close quotes before searching
  //if the quote isn't closed - remove the last one
  if (text && (text.match(/"/g) || []).length % 2 != 0) {
    var lastQuote = text.lastIndexOf('"');
    text = text.substr(0, lastQuote) + text.substr(lastQuote + 1, text.length - 1);
  }

  if (text == null || text === '') {
    query = _.cloneDeep(templates.queryMatchAll);

    if (!searchOptions.sort) {
      searchOptions.sort = [{
        created_date: "desc"
      }];
    }
  } else {
    query = _.cloneDeep(templates.queryTemplate);

    // If there is a list of fields, then specify them.
    // Otherwise, send the text in the _all field.
    if (Array.isArray(searchOptions.fields) && searchOptions.fields.length > 0) {
      query.filtered.query.multi_match.fields = searchOptions.fields;

      // set the search text.
      query.filtered.query.multi_match.query = text;

      // if search type has been provided in the searchOptions, set it.
      if (searchOptions.type) {
        query.filtered.query.multi_match.type = searchOptions.type;
      }

    } else {

      // no fields set, then use fuzzy query.
      query.filtered.query = _.cloneDeep(templates.noFields);
      query.filtered.query.query_string.query = text;

    }
  }

  // check search options and remove the active filter if searchOptions asked for it to be turned off.
  if (searchOptions.active === false) {
    delete query.filtered.filter;
  }

  if (searchOptions.filters) {
    //Create query scaffold
    query = {
      bool: {
        must: [query]
      }
    };

    //Add each filter to the must array in the query
    for (var x = 0; x < searchOptions.filters.length; x++) {
      query.bool.must.push(searchOptions.filters[x]);
    }
  }

  return {
    query: query,
    options: searchOptions
  };
}
