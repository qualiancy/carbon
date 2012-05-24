/*!
 * Carbon CLI
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var carbon = require('../../carbon')
  , electron = require('electron');

/*!
 * Create an electron based cli
 */

program = electron('carbon')
  .name('Carbon')
  .version(carbon.version);

/*!
 * Load all the CLI submodules
 */

require('./proxyTable');
require('./balancer');

/*!
 * main export
 */

module.exports = program;
