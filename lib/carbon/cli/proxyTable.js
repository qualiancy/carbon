/*!
 * Carbon - cli proxy table
 * Copyright (c) 2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Help descriptor
 */

var help = {
    name: 'proxy'
  , description: 'simple proxying using a proxy table file'
};

/*!
 * Main export
 */

module.exports = function (cli) {
  cli.emit('--register', help);
  cli.on('proxy', proxyByTable);
};

/**
 * # proxyByTable
 *
 * We are lazy loading everything we need to
 * create a proxy table.
 *
 * @param {Object} optimist parsed cmd args
 */

function proxyByTable (args) {
  var carbon = require('../../carbon');
  console.log('you have reached the proxy table');
}
