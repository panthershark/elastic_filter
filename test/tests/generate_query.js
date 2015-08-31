var App = require('mixdown-app').App;
var YourPlugin = require('../../index.js');
var assert = require('assert');
var templates = require("../../lib/templates.js");

suite('Generate Query: ', function () {
  var app = new App();

  setup(function (done) {

    // create plugin
    var p = new YourPlugin({});

    // attach it
    app.use(p, 'es_plugin');

    app.setup(done);
  });


  test('Raw search template is as expected with no input', function (done) {

    var new_query = app.es_plugin.generateQuery();

    assert(typeof (new_query) != "undefined", "The new_query should be defined.");
    assert(JSON.stringify(new_query.query) == JSON.stringify(templates.queryMatchAll), "template with no text should match blank match all.");

    done();

  });


  test('Match all template is as expected with just text.', function (done) {

    var new_query = app.es_plugin.generateQuery("foo");
    assert(typeof (new_query) != "undefined", "The new_query should be defined.");
    assert.equal(new_query.query.filtered.query.query_string.query, "foo", "template with just text should match - match all template");

    done();
  });

  test('Match query template is expected when searchOptions.fields is present.', function (done) {
    var searchFields = ["flavor", "color", "name^2"];

    var new_query = app.es_plugin.generateQuery("foo", {
      fields: ["flavor", "color", "name^2"]
    });

    assert(typeof (new_query) != "undefined", "The new_query should be defined.");
    assert(typeof (new_query.query.filtered.query.multi_match) != "undefined", "multi_match section should be present in query.");
    assert.equal(new_query.query.filtered.query.multi_match.query, "foo", "multi_match query text should match text passed.");
    assert.equal(JSON.stringify(new_query.query.filtered.query.multi_match.fields), JSON.stringify(searchFields), "multi_match query fields should match fields passed.");

    done();
  });

  test('Specifying searchOptions.type should change the type of multi_match search.', function (done) {
    var searchFields = ["flavor", "color", "name^2"];

    var new_query = app.es_plugin.generateQuery("foo", {
      fields: ["flavor", "color", "name^2"],
      type: "prefix_match"
    });

    assert(typeof (new_query) != "undefined", "The new_query should be defined.");
    assert(typeof (new_query.query.filtered.query.multi_match) != "undefined", "multi_match section should be present in query.");
    assert.equal(new_query.query.filtered.query.multi_match.query, "foo", "multi_match query text should match text passed.");

    assert.equal(new_query.query.filtered.query.multi_match.type, "prefix_match", "multi_match type should match searchOption passed.");

    done();
  });

  test('unclosed quotation mark in text gets closed.', function (done) {

    var new_query = app.es_plugin.generateQuery("\"foo\" and another \" mark somewhere");
    assert(typeof (new_query) != "undefined", "The new_query should be defined.");

    //the extraneous quotation mark should be removed.
    assert.equal(new_query.query.filtered.query.query_string.query, "\"foo\" and another  mark somewhere", "template with just text should match - match all template");

    done();
  });

  test('searchOption.active removes active filter.', function (done) {

    var new_query = app.es_plugin.generateQuery("foo", {
      active: false
    });

    assert(typeof (new_query) != "undefined", "The new_query should be defined.");
    assert.equal(new_query.query.filtered.query.query_string.query, "foo", "template with just text should match - match all template");
    //we shouldn't have an active filter on the query.
    assert(typeof (new_query.query.filtered.filter) == "undefined", "template with just text should match - match all template");

    done();
  });


});
