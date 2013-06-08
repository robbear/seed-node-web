//
// Module dependencies
//
var express = require('express'),
    connect = require('connect'),
    uuid = require('node-uuid'),
    logger = require('./logger/logger'),
    utilities = require('./utilities/utilities'),
    config = require('./utilities/config');

// Routes
var routes = [
    './controllers/index',
    './controllers/test',
    './controllers/version',
    './controllers/notfound',
    './controllers/error'
];

// We need the 404 and error routes specifically, so reference it here
var notfoundController = require('./controllers/notfound');
var errorController = require('./controllers/error');

var app = module.exports = express();

logger.bunyanLogger().info("***** Starting  web application *****");

function logRequest(req, res, next) {
    req.req_id = uuid.v4();

    logger.bunyanLogger().info({req: req}, "REQUEST");
    next();
}

function logError(err, req, res, next) {
    logger.bunyanLogger().error({err: err, req: req});
    console.log(err.stack);

    // Route to error handler page
    errorController.handler(req, res);
}

//
// Initialize templates
//
utilities.initTemplates();

app.set('view engine', 'html');
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.favicon(__dirname + '/public/favicon.ico'));
if (config.logStaticResources) {
    app.use(logRequest);
}
app.use(express.logger({ format: ':response-time ms - :date - :req[x-real-ip] - :method :url :user-agent / :referrer' }));
app.use(express.static(__dirname + '/public'));
if (!config.logStaticResources) {
    app.use(logRequest);
}

//
// Entry point for all requests - Map www
//
app.get('*', function(req, res, next) {
    //
    // Map http://www.host.com/foo/bar to http://host.com/foo/bar
    //
    if(req.host.match('www.')) {
        var index = req.host.indexOf('www.');
        var newHost = req.host.substring(index + 4);
        var protocol = (req.header('X-Forwarded-Protocol') == 'https') ? 'https://' : 'http://';
        var newUrl = protocol + newHost + req.url;
        res.writeHead(301, { 'Location': newUrl, 'Expires': (new Date).toGMTString() });
        res.end();
    }
    else {
        return next();
    }
});

//
// Build the routes from the array of routes above
//
for (var i = 0; i < routes.length; i++) {
    app.use(require(routes[i]));
}

// Error handling
app.use(logError);

// 404 handling
app.use(function(req, res, next) {
    notfoundController.handler(req, res, next);
});

app.listen(process.env.PORT || 1337);
logger.bunyanLogger().info("NodeWebSite server listening on port %s in %s mode", process.env.PORT || 1337, config.environment);
logger.bunyanLogger().info("Using node.js %s, connect %s, Express %s", process.version, connect.version, express.version);