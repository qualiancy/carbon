
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

function defaults(type) {
  return {
      port: { type: Number, required: true }
    , name: { type: String, required: true, length: { min: 4, max: 128 }}
    , type: { type: String, required: true, default: type }
    , strategy: { type: String, default: 'random' }
  };
}

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

exports.create = function(app, type, opts, cb) {
  setImmediate(function() {
    var Balancer = store[type];
    if (!Balancer) return cb(Error('invalid balancer type'));

    var balancer = new Balancer.ctor(app, opts);

    if ('error' === balancer.state) {
      var err = balancer._balancerState.stateArgs[0];
      err.code = 'EBADOPTIONS';
      return cb(err);
    }

    cb(null, balancer);
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
 * HTTP(S) / WS(S)
 */

exports.define('http', require('./proto/http'));
