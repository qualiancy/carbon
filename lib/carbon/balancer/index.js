
/*!
 * Module dependendies
 */

var extend = require('tea-extend');

/*!
 * Base constructor
 */

var Base = require('./proto/_base');

/*!
 * Forced options for all balancers.
 */

var OPTIONS = {
    address: { type: String, default: '0.0.0.0' }
  , port: { type: Number, required: true }
  , name: { type: String, required: true, length: { min: 4, max: 128 }}
  , type: { type: String, required: true }
  , strategy: { type: String, default: 'random' }
};

/*!
 * Balancer storage
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
  if ('string' !== typeof type) throw new Error('balancer type required');
  if (store[type]) throw new Error('balancer name already defined');
  if ('object' !== typeof spec) throw new Error('balancer spec required');

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
 * ##### .create(name, opts)
 *
 * Get a specification by name.
 *
 * @param {String} type
 * @return {Object} specification
 * @api public
 */

exports.create = function(app, type, opts) {
  if ('string' !== typeof type) opts = type, type = opts.type;
  var Klass = store[type];
  if (!Klass) throw new Error('invalid balancer type');
  return new Klass.ctor(app, extend({}, opts, { type: type }));;
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
 * HTTP(S) / WS(S)
 */

exports.define('http', require('./proto/http'));
