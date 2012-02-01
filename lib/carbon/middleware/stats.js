/*!
 * Carbon - stats middleware
 * Copyright (c) 2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var hakaru = require('hakaru');

/*!
 * Main exports
 */

exports = module.exports = createRepository;

/*!
 * Adding storage options to stats exports
 */

exports.MemoryStore = hakaru.MemoryStore;

/*!
 * Returning a new hakaru repository with options
 */

function createRepository (options) {
  var stats = new hakaru.Repository(options);
  // Augmenting our stats object with middleware function
  stats.middleware = function (opts) {
    opts = opts || {};
    var request = opts.request || 'request'
      , response = opts.response || 'response'
      , missed = opts.missed || 'missed';
    // actual middleware function for proxy
    return function (req, res, next) {
      stats.mark(request);
      req.once('proxy', function () {
        var end = stats.start(response);
        res.once('end', end);
      });
      req.once('proxy miss', function () {
        stats.mark(missed);
      });
      next();
    }
  }
  // allows user to provide own reporting mechanisms
  return stats;
}
