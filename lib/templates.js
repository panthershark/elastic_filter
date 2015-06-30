var noFields = {
  "query_string": {
    "query": "*"
  }
};

var queryTemplate = {
  "filtered": {
    "query": {
      "multi_match": {
        "query": "this is a test",
        "type": "best_fields",
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

module.exports = {
  noFields: noFields,
  queryTemplate: queryTemplate,
  queryMatchAll: queryMatchAll,
  rawSearch: rawSearch
};
