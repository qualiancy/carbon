/*!
 * Carbon - balancer middleware
 * Copyright (c) 2012 Jake Luer <jake@alogicalparadox.com>
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

exports = module.exports = balancer;

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

  master.spawnWorkers();

  return function (req, res, next) {
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
  }
}
