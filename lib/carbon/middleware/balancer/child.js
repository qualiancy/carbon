/*!
 * Carbon - balancer middleware (child)
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var child = require('cohesion').child()
  , debug = require('sherlock')('carbon:balancer-child')
  , server = require(child.config.server);

/**
 * Start the server on the port from argv
 */

function startServer (port) {
  server.listen(port, function () {
    debug('child process listening on port %d', port);
    child.emit('listening');
  });
}

/**
 * In case of race conditions, reassign port
 */

child.on('port', function (port) {
  child.config.port = port;
  startServer(port);
});

/**
 * Listen for server errors. Only throw error
 * if it is not `EADDRINUSE`.
 */

server.on('error', function (err) {
  debug('child process error: %s', err.message || '');
  if (err.code == 'EADDRINUSE') {
    child.emit('EADDRINUSE');
  } else {
    throw err;
  }
});

/*!
 * Start with original port
 */

startServer(child.config.port);
