
var express = require('express'),
    utilities = require('../utilities/utilities');

var app = module.exports = express();

app.get('/test', function(req, res) {
    utilities.sendOutputHtml("root", req, res, 'views/test_header.html', 'views/test_body.html',
        {
            "PageTitle": "Web Site - Test"
        });
});
