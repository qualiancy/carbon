/*!
 * Attach chai to global should
 */

global.chai = require('chai');
global.should = global.chai.should();

/*!
 * Chai Plugins
 */

global.chai.use(require('chai-spies'));
global.chai.use(require('chai-http'));

/*!
 * Import project
 */

global.carbon = require('../..');

/*!
 * Helper to load internals for cov unit tests
 */

function req (name) {
  return process.env.CARBON_COV
    ? require('../../lib-cov/carbon/' + name)
    : require('../../lib/carbon/' + name);
}

/*!
 * Load unexposed modules for unit tests
 */

global.__carbon = {
    Server: req('server/proto/_base')
  , serverManager: req('server/index')
  , Servers: req('servers')
};

var count = 0;

global._uid = function(str) {
  return (str || '') + (++count);
};

global.noop = function() {};

global.anoop = function() {
  var args = [].slice.call(arguments);
  var cb = args[args.length - 1];
  setImmediate(cb);
};
