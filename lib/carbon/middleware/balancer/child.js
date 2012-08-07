/*!
 * Carbon - balancer middleware (child)
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var child = require('cohesion').child()
  , debug = require('debug')('carbon-balancer:spawn')
  , port = child.config.port
  , server = require(child.config.file);


/**
 * Listen for server errors. Only throw error
 * if it is not `EADDRINUSE`.
 */

server.on('error', function (err) {
  debug('child process error: %s', err.message || '');
  if (err.code == 'EADDRINUSE') child.stop();
  else throw err;
});

/**
 * Start the server on the port from argv
 */

server.listen(port, function () {
  debug('child process listening on port %d', port);
  child.emit('listening');
});
