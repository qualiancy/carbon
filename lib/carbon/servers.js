
/*!
 * Module dependencies
 */

var debug = require('sherlock')('carbon:servers');
var Hash = require('gaia-hash').Hash;
var inherits = require('util').inherits;

/*!
 * Internal constructors
 */

var servers = require('./server');

/*!
 * Primary exports
 */

module.exports = Servers;

/**
 * ### Server(app)
 *
 * The collection of active servers.
 *
 * @param {Application} application
 * @api public
 */

function Servers(app) {
  Hash.call(this, null, { findRoot: '_serverStore.settings' });
  this.app = app;
}

/*!
 * Inherits from Hash
 */

inherits(Servers, Hash);

/**
 * #### .findOrCreate(opts, cb)
 *
 * Find or create a server based on the options
 * given.
 *
 * @param {Object} options
 * @param {Function} callback
 * @cb {Error|null} if error
 * @cb {Server} constructed or returned
 * @api public
 */

Servers.prototype.findOrCreate = function(type, opts, cb) {
  if ('number' === typeof opts) opts = { port: opts };
  if (!opts.address) opts.address = '0.0.0.0';

  function done(ex, res) {
    setImmediate(function() { cb(ex, res); });
  }

  var query = { port: opts.port, address: opts.address };
  var server = this.find(query).at(0);
  var err;

  if (!servers.has(type)) {
    err = new Error('Server type of "' + type + '" does not exist.');
    return done(err);
  }

  if (server && type !== server.get('type')) {
    err = new Error('Server found at address:port but wrong type.');
    return done(err);
  }

  if (!server) {
    try { server = servers.create(type, opts); }
    catch (ex) { return done(ex); }
    this.set(opts.address + ':' + opts.port, server);
  }

  done(null, server);
};
