/*!
 * Carbon - balancer middleware
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var debug = require('debug')('carbon:balancer')
  , env = process.env.NODE_ENV
  , Master = require('./balancer/master');

/*!
 * Main exports
 */

module.exports = balancer;

/**
 * # balancer
 *
 * Mounts the provided server to master and begins
 * the startup sequence.
 *
 * @param {Server} node http compatible server (connect, express)
 * @param {Options} options
 */

function balancer (server, options) {
  options = options || {};
  debug('balancer route registered', options);
  var master = new Master(server, options)
    , bal_host = options.host;

  if (!bal_host)
    throw new Error('Carbon Balancer requires `host` configuration');

  master.spawnWorkers();

  master.middleware = function (req, res, next) {
    var address = req.headers.host.split(':')
      , req_host = address[0]
      , req_port = address[1] || 80;

    if (bal_host && (bal_host == req_host || bal_host == '*')) {
      return master.getNextWorker(function (err, port) {
        debug('balancer routing to port %d', port);
        next(port);
      });
    }

    next();
  };

  return master;
}
