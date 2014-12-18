var App = require('mixdown-app').App;
var YourPlugin = require('../../index.js');
var assert = require('assert');

suite('Attach/Detach', function() {
  var app = new App();

  setup(function(done) {

    // create plugin
    var p = new YourPlugin({

      // *******************************
      // TODO: put your config here.
      // *******************************

    });

    // attach it
    app.use(p, 'foo');

    app.setup(done);
  });

  test('Attach & Detach', function(done) {
    assert.equal(typeof(app.foo), 'object', 'Interface should exist');
    app.remove('foo');
    assert.equal(app.foo, null, 'Interface is removed');
    done();
  });
});
