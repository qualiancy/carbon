/*!
 * Carbon - logger middleware
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var quantum = require('quantum')
  , debug = require('debug')('carbon:logger');

/*!
 * Main exports
 */

var exports = module.exports = createRepository;

/*!
 * Adding transport options to stats exports
 */

exports.transports = {};

for (var name in quantum.transports) {
  exports[name] = quantum.transports[name];
  exports.transports[name] = quantum.transports[name];
}

/*!
 * Return a new quantum logger, slightly modified.
 */

function createRepository (name, options) {
  options = options || {};
  options.levels = 'http';

  var logger = new quantum.Logger(name, options);
  debug('logger middleware initialize', options)

  // not allowing change of levels
  logger.levels = function () {};

  // Augmenting our logger object with middleware function
  logger.middleware = function (opts) {
    opts = opts || {};

    // actual middleware function for proxy
    return function (req, res, next) {
      var method = req.method.toUpperCase()
        , url = req.url;

      res.once('proxy start', function () {
        logger.write(method, url);
      });

      next();
    };
  };

  // allows user to provide own reporting mechanisms
  return logger;
}
