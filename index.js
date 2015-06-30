var BasePlugin = require('mixdown-app').Plugin;
// var CorePlugin = require('core-plugin');
var _ = require('lodash');
var elasticsearch = require('elasticsearch');
var async = require('async');

var raw_search = require("./lib/raw_search.js");
var generate_query = require("./lib/generate_query.js");

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


module.exports = BasePlugin.extend({
  //the primary method which does everything
  //accepting a string of text, search options, and return any matching
  //ES results.
  search: function (text, searchOptions, callback) {
    var self = this;
    if (arguments.length === 2 && typeof (searchOptions) === 'function') {
      callback = searchOptions;
      searchOptions = {};
    }

    if (typeof (callback) !== 'function') {
      throw new Error('Callback not defined.');
    }

    var elasticsearch = self.generate_query(text, searchOptions);

    //now that we've generated a query & es options - call rawSearch.
    self.rawSearch(elasticsearch.query, elasticsearch.options, function (rawSearchErr, data) {
      if (rawSearchErr) {
        callback(rawSearchErr);
        return; // THIS IS IMPORTANT
      }

      callback(rawSearchErr, data);

    });

  },
  rawSearch: null,
  //given text & search options, will build a proper ES query
  //for raw search.
  generateQuery: null,
  _setup: function (done) {
    var elastic_options = this._options;

    // NOTE: "this" is the plugin itself.  no need to use the getter/setter here.  Only on the interface exposed to users.
    this.elastic = create_elastic_client(elastic_options);

    this.rawSearch = raw_search;

    this.generateQuery = generate_query;

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
