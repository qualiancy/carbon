/*!
 * Carbon - proxyTable middleware
 * Copyright (c) 2012 Jake Luer <jake@alogicalparadox.com>
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

var cli = new Drip({ delimeter: ' ' })

/**
 * Event for submodules to register help commands
 */

var help = [];
cli.on('--register', function (_help) {
  help.push(_help);
});

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

/**
 * Load all the CLI submodules, executing
 * their export, passing the cli drip.
 */

require('./cli/proxyTable')(cli);
require('./cli/balancer')(cli);

/*!
 * Main exports
 */

module.exports = function (command, args) {
  // if no command, check for basics
  if (command.length == 0) {
    if (args.v || args.version) command = '--version';
    if (args.h || args.help) command = '--help';
  }

  if (process.env.DEBUG) {
    console.log(args);
  }

  cli.emit(command, args);
};
