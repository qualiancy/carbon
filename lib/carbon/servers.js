
/*!
 * Module dependencies
 */

var debug = require('sherlock')('carbon:servers');
var EventEmitter = require('drip').EventEmitter;
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
 * ### Servers(context)
 *
 * The collection of servers.
 *
 * @param {Supervisor} context
 * @api public
 */

function Servers(ctx) {
  Hash.call(this, null, { findRoot: '_serverStore.settings' });
  this.ctx = ctx;
}

/*!
 * Inherits from Hash
 */

inherits(Servers, Hash);

/*!
 * Mixin the EventEmitter
 */

EventEmitter(Servers.prototype);

/*!
 * Hook into hash#set to ensure a
 * `create` event is emitted on the
 * current Servers instance.
 *
 * @param {String} key
 * @return this
 * @api private
 */

Servers.prototype.set = function(key, value) {
  Hash.prototype.set.call(this, key, value);
  this.emit('create', value);
  return this;
};

/*!
 * Hook into hash#del to ensure the
 * `delete` event is emitted on the
 * server that is being removed.
 *
 * @param {String} key
 * @return this
 * @api private
 */

Servers.prototype.del = function(key) {
  var server = this.get(key);
  Hash.prototype.del.call(this, key);
  server.emit('delete');
  return this;
};

/**
 * #### .findOrCreate(type, opts, cb)
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
  var err;

  function done(ex, res) {
    setImmediate(function() { cb(ex, res); });
  }

  if (!servers.has(type)) {
    err = new Error('Server type of "' + type + '" does not exist.');
    return done(err);
  }

  var self = this;
  var query = { port: opts.port, address: opts.address };
  var server = this.find(query).at(0);

  if (server && type !== server.get('type')) {
    err = new Error('Server found at address:port but wrong type.');
    return done(err);
  } else if (server) {
    return done(null, server);
  }

  servers.create(type, opts, function(err, server) {
    if (err) return cb(err);
    self.set(opts.address + ':' + opts.port, server);
    cb(null, server);
  });
};
