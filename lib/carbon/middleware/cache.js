/*!
 * Carbon - cache middleware
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var debug = require('debug')('carbon:cache');

/*!
 * Main exports
 */

exports = module.exports = function () {
  return function (req, res, next) {
    next();
  }
};
