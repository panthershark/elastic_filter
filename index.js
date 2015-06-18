var BasePlugin = require('mixdown-app').Plugin;
// var CorePlugin = require('core-plugin');
var _ = require('lodash');
var elasticsearch = require('elasticsearch');
var async = require('async');

var create_elastic_client = function (elastic_options) {

  _.defaults(elastic_options, {
    host: "localhost:9200",
    log: null,
    sniffOnStart: true,
    sniffInterval: 60000,
    apiVersion: "1.1"
  });

  return new elasticsearch.Client(_.pick(elastic_options, 'host', 'log', 'sniffInterval', 'sniffOnStart'));
};

var noFields = {
  "query_string": {
    "query": "*"
  }
};

//updated to use phrase_prefix instead of best_fields
//as typical search intuition is prefix matching
var queryTemplate = {
  "filtered": {
    "query": {
      "multi_match": {
        "query": "this is a test",
        "type": "phrase_prefix",
        "fields": null
      }
    },
    "filter": {
      "bool": {
        "must": [{
          "bool": {
            "should": [{
              "term": {
                "active": true
              }
            }, {
              "not": {
                "filter": {
                  "exists": {
                    "field": "active"
                  }
                }
              }
            }]
          }
        }]
      }
    },
    "strategy": "leap_frog"
  }
};

var queryMatchAll = {
  "filtered": {
    "query": {
      "query_string": {
        "query": "*"
      }
    },
    "filter": {
      "bool": {
        "must": [{
          "bool": {
            "should": [{
              "term": {
                "active": true
              }
            }, {
              "not": {
                "filter": {
                  "exists": {
                    "field": "active"
                  }
                }
              }
            }]
          }
        }]
      }
    },
    "strategy": "leap_frog"
  }
};


var rawSearch = {
  "query": null,
  "from": 0,
  "size": 10,
  "sort": [],
  "version": true
};


module.exports = BasePlugin.extend({
  search: function (text, searchOptions, callback) {
    var self = this;

    if (arguments.length === 2 && typeof (searchOptions) === 'function') {
      callback = searchOptions;
      searchOptions = {};
    }

    if (typeof (callback) !== 'function') {
      throw new Error('Callback not defined.');
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
      query = _.cloneDeep(queryMatchAll);

      if (!searchOptions.sort) {
        searchOptions.sort = [{
          created_date: "desc"
        }];
      }
    } else {
      query = _.cloneDeep(queryTemplate);

      // If there is a list of fields, then specify them.
      // Otherwise, send the text in the _all field.
      if (Array.isArray(searchOptions.fields) && searchOptions.fields.length > 0) {
        query.filtered.query.multi_match.fields = searchOptions.fields;

        // set the search text.
        query.filtered.query.multi_match.query = text;
      } else {

        // no fields set, then use fuzzy query.
        query.filtered.query = _.cloneDeep(noFields);
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

    //Only return back the ids
    searchOptions.result_fields = searchOptions.result_fields || [];

    self.rawSearch(query, searchOptions, function (rawSearchErr, data) {
      if (rawSearchErr) {
        callback(rawSearchErr);
        return; // THIS IS IMPORTANT
      }

      callback(rawSearchErr, data);

    });
  },
  rawSearch: function (query, searchOptions, callback) {
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

    return search;
  },
  _setup: function (done) {
    var elastic_options = this._options;

    // NOTE: "this" is the plugin itself.  no need to use the getter/setter here.  Only on the interface exposed to users.
    this.elastic = create_elastic_client(elastic_options);

    var setup_ops = [];
    var self = this;

    setup_ops.push(function (cb) {
      self.elastic.ping({
        requestTimeout: 10000
      }, cb);
    });

    async.parallel(setup_ops, function (err) {
      if (err) {
        done(err);
        return;
      }

      done();
    });
  }
});
