/*!
 * Carbon - balancer middleware
 * Copyright (c) 2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var fork = require('child_projess').fork
  , debug = require('debug')('carbon:balancer')
  , env = process.env.NODE_ENV;

/*!
 * Main exports
 */

exports = module.exports = balancer;


function balancer (server, options) {
  options = options || {};
  return function (req, res, next) {
    next();
  }
}
