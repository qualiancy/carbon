
/*!
 * Module dependencies
 */

var debug = require('sherlock')('carbon:servers');
var Hash = require('gaia-hash').Hash;
var inherits = require('util').inherits;

/*!
 * Internal constructors
 */

var servers = require('../servers');

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
 * given. If a server is being created it will
 * be returned when it is fully initialized.
 *
 * @param {Object} options
 * @param {Function} callback
 * @cb {Error|null} if error
 * @cb {Server} constructed or returned
 * @api public
 */

Servers.prototype.findOrCreate = function(opts, cb) {
  function done(ex, serv) {
    if (ex) {
      debug('(findOrCreate) error: %s', ex.message);
      cb(ex);
    } else {
      debug('(findOrCreate) found: %s/%s', serv.name, serv.type);
      cb(null, serv);
    }
  }

  if ('number' === typeof opts) opts = { port: opts };
  if (!opts.address) opts.address = '0.0.0.0';
  if (!opts.type) opts.type = 'http';

  //check for server
  var key = opts.address + ':' + opts.port;
  var server = this.get(key);
  var type = opts.type.toLowerCase();

  if (server && server.type !== type) {
    err = new Error('Server of wrong type.');
    done(err);
  } else if (server) {
    server.listen(function(err) {
      done(err, server);
    });
  } else {
    debug('(findOrCreate) create: %s/%s', key, type);
    server = new servers[type](key, opts);
    this.set(key, server);
    server.listen(function(err) {
      if (err) return done(err);
      debug('(findOrCreate) listening: %s/%s', key, type);
      cb(null, server);
    });
  }
};
