
/*!
 * Module dependendies
 */

var extend = require('tea-extend');

/*!
 * Base constructor
 */

var Base = require('./proto/_base');

/*!
 * Forced options for all servers.
 */

function defaults(type) {
  return {
      address: { type: String, default: '0.0.0.0' }
    , port: { type: Number, required: true }
    , type: { type: String, required: true, default: type }
  };
}

/*!
 * Server storage
 */

var store = {};

/**
 * ##### .define(name, spec)
 *
 * @param {String} name
 * @param {Object} specification
 * @api public
 */

exports.define = function(type, spec) {
  if ('string' !== typeof type) throw new Error('server type required');
  if (store[type]) throw new Error('server name already defined');
  if ('object' !== typeof spec) throw new Error('server spec required');

  var Klass = store[spec.inherits || 'base'];
  if (!Klass) throw new Error('server inheritance unknown');

  var schema = {};
  extend(schema, Klass.options); // inherited options
  extend(schema, spec.options || {}); // specified options
  extend(schema, defaults(type)); // strict defaults

  store[type] = {
      ctor: Klass.ctor.extend(schema, spec.proto)
    , options: schema
    , type: type
  };
};

/**
 * ##### .list()
 *
 * Get a list of all server types.
 *
 * @return {Array} server types
 * @api public
 */

exports.list = function() {
  return Object.keys(store);
};

/**
 * ##### .has(type)
 *
 * Determine if server type is defined.
 *
 * @param {String} type
 * @return {Boolean} defined
 * @api public
 */

exports.has = function(type) {
  return !! store[type];
};

/**
 * ##### .create(name, opts)
 *
 * Get a specification by name.
 *
 * @param {String} type
 * @return {Object} specification
 * @api public
 */

exports.create = function(type, opts, cb) {
  setImmediate(function() {
    var Server = store[type];
    if (!Server) return cb(new Error('invalid server type'));

    var server = new Server.ctor(opts);

    if ('error' === server.state) {
      var err = server._serverState.stateArgs[0];
      err.code = 'EBADOPTIONS';
      return cb(err);
    }

    cb(null, server);
  });
};

/*!
 * Base
 */

store['base'] = {
    ctor: Base.extend(defaults('base'))
  , options: defaults('base')
  , type: 'base'
};

/*!
 * Load
 */

exports.define('http', require('./proto/http'));
