/*!
 * Carbon - balancer middleware (spawn)
 * Copyright (c) 2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var args = process.argv
  , server = require(args[2])
  , port = args[3]
  , debug = require('debug')('carbon:spawn');

/**
 * Message listener from worker instance
 */

process.on('message', function (msg) {
  var message = JSON.parse(msg);
  debug('message received', message);
  switch (message.command) {
    case 'shutdown':
      process.exit(0);
      break;
    default:
      break;
  }
});

/**
 * Start the server on the port from argv
 */

server.listen(port, function () {
  debug('child process listening on port %d', port);
  process.send(JSON.stringify({ command: 'active' }));
});

setInterval(function () {
  try {
    process.send(JSON.stringify({ command: 'ping' }));
  } catch (err) {
    debug('lost connection with master. peace!');
    process.exit(1);
  }
}, 10000);
