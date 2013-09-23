
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

var OPTIONS = {
    address: { type: String, default: '0.0.0.0' }
  , port: { type: Number, required: true }
  , type: { type: String, required: true }
};

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
  extend(schema, OPTIONS); // strict defaults

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

exports.create = function(type, opts) {
  if ('string' !== typeof type) opts = type, type = opts.type;
  var Klass = store[type];
  if (!Klass) throw new Error('invalid server type');
  return new Klass.ctor(extend({}, opts, { type: type }));
};

/*!
 * Base
 */

store['base'] = {
    ctor: Base.extend(OPTIONS)
  , options: OPTIONS
  , type: 'base'
};

/*!
 * Load
 */

exports.define('http', require('./proto/http'));
