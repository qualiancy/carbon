/*!
 * Carbon - cli balancer
 * Copyright (c) 2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Help descriptor
 */

var help = {
    name: 'balance'
  , description: 'Balance a server'
};

/*!
 * Main export
 */

module.exports = function (cli) {
  cli.emit('--register', help);
  cli.on('balance', balance);
};

/**
 * # balance
 *
 * We are lazy loading everything we need to
 * create a balancer.
 *
 * @param {Object} optimist parsed cmd args
 */

function balance (args) {
  var carbon = require('../../carbon');
  console.log('you have reached the balancer');
}
