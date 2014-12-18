elastic_filter
==============

Elastic Search plugin for generating filtered queries.

Standalone

```
var ElasticFilter = require('elastic_filter');
var elastic = new ElasticFilter({
  "host": "localhost:9200",
  "log": "error"

  /** see elasticsearch.js docs for more options **/
});

var searchOptions = {
    fields: [],
    type: 'person',
    index: 'person',
    pagenum: 1,
    pagesize: 20,
    sort: ["age"],
    result_fields: ["id", "first_name", "last_name", "created_date", "other_property"],
    filters: {
    	first_name: "Bill"
    	/** supports multiple filters **/
  	}
  };

elastic.search('optional free form term', searchOptions, function(err, data) {
	console.log(err, data);  
});
```


With Mixdown App

```
var App = require('mixdown-app').App;
var ElasticFilter = require('elastic_filter');

var app = new App();
app.use(new ElasticFilter({
  "host": "localhost:9200",
  "log": "error"

  /** see elasticsearch.js docs for more options **/
}), 'elastic');

var searchOptions = {
    fields: [],
    type: 'person',
    index: 'person',
    pagenum: 1,
    pagesize: 20,
    sort: ["age"],
    result_fields: ["id", "first_name", "last_name", "created_date", "other_property"],
    filters: {
    	first_name: "Bill"
    	/** supports multiple filters **/
  	}
  };

app.elastic.search('optional free form term', searchOptions, function(err, data) {
	console.log(err, data);  
});
```