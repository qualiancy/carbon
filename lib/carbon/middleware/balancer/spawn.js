/*!
 * Carbon - balancer middleware (spawn)
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var args = process.argv
  , server = require(args[2])
  , port = args[3]
  , debug = require('debug')('carbon-balancer:spawn');

/**
 * Message listener from worker instance
 */

process.on('message', function (msg) {
  var message = JSON.parse(msg);
  debug('message received', message);
  switch (message.command) {
    case 'shutdown':
      // TODO: soft shutdown?
      process.exit(0);
      break;
    default:
      break;
  }
});

/**
 * Listen for server errors. Only throw error
 * if it is not `EADDRINUSE`.
 */

server.on('error', function (err) {
  debug('child process error: %s', err.message);
  if (err.code == 'EADDRINUSE') {
    process.exit(1);
  } else {
    throw err;
    process.exit(1);
  }
});

/**
 * Start the server on the port from argv
 */

server.listen(port, function () {
  debug('child process listening on port %d', port);
  process.send(JSON.stringify({ command: 'active' }));
});

/**
 * Check for existence of master process. Shutdown self
 * if the master is longer available.
 */

setInterval(function () {
  try {
    process.send(JSON.stringify({ command: 'ping' }));
  } catch (err) {
    debug('%s lost connection with master. peace!', args[2]);
    process.exit(1);
  }
}, 10000);
