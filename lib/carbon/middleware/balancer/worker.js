/*!
 * Carbon - balancer middleware
 * Copyright (c) 2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var Drip = require('drip')
  , util = require('util')
  , fork = require('child_process').fork
  , env = process.env.NODE_ENV
  , debug = require('debug')('carbon-balancer:worker');
