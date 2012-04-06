/*!
 * Carbon - proxyTable middleware
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var Drip = require('drip')
  , tea = require('tea')
  , carbon = require('../carbon')
  , help = [];

/*!
 * Create our event driven CLI
 */

cli = new Drip({ delimeter: ' ' })

/**
 * Helper for registering help topics
 */

cli.register = function (_help) {
  help.push(_help);
};

/**
 * Display the help info
 */

cli.on('--help', function (args) {
  console.log(help);
});

/**
 * Quick print of version
 */

cli.on('--version', function () {
  console.log(carbon.version);
});

/*!
 * Load all the CLI submodules
 */

require('./cli/proxyTable');
require('./cli/balancer');

/*!
 * Main exports
 */

module.exports = function (command, args) {
  // if no command, check for basics
  if (command.length == 0) {
    if (args.v || args.version) command = '--version';
    if (args.h || args.help) command = '--help';
  }

  cli.emit(command, args);
};
