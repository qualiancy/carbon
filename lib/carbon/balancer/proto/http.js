
/*!
 * Module dependencies
 */

var net = require('net');

/*!
 * Inherit from base
 */

exports.inherits = 'base';

/*!
 * Set prototype methods
 */

exports.proto = require('./http.proto');

/*!
 * Options
 */

exports.options = {};

/**
 * ##### proxy
 *
 * Specifies the server events to proxy.
 *
 * @param {Array}
 */

exports.options.proxy = {
    type: 'array'
  , default: [ 'request', 'upgrade', 'connect' ]
  , length: { min: 1 }
  , validate: validateProxyType
};

/*!
 * Proxy event type validation hook.
 *
 * @param {Array} event
 * @param {Object} original spec
 * @param {Function} assert (throws on error)
 * @throw {AssertionError} on invalid event
 * @api private
 */

function validateProxyType(events, spec, assert) {
  var allowed = spec.default;
  events.forEach(function(type) {
    assert(
        ~allowed.indexOf(type)
      , 'Expect a valid proxy type but got "' + type + '".'
      , { needle: type, haystack: allowed }
    );
  });
}

/**
 * ##### ips
 *
 * Specifies ip addresses to use when creating
 * incoming listeners.
 *
 * @param {Array}
 */

exports.options.ips = {
    type: 'array'
  , length: { min: 1 }
  , required: true
  , validate: validateProxyIPs
  , cast: castProxyIPs
};

/*!
 * Virtual IP validation hook.
 *
 * @param {Array} event
 * @param {Object} original spec
 * @param {Function} assert (throws on error)
 * @throw {AssertionError} on invalid ip
 * @api private
 */

function validateProxyIPs(ips, spec, assert) {
  ips.forEach(function(ip) {
    assert(
        net.isIP(ip)
      , 'Expect an ip address but got "' + ip + '".'
    )
  });
}

/*!
 * Virtual IP cast hook.
 *
 * @param {Array} event
 * @param {Object} original spec
 * @param {Function} assert (throws on error)
 * @throw {AssertionError} on invalid ip
 * @api private
 */

function castProxyIPs(ips, spec, assert) {
  return ips.map(function(ip) {
    var version = net.isIPv6(ip) ? 'IPV6' : 'IPV4';
    return { address: ip, ipVersion: version };
  });
}
