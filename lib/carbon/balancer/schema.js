
/*!
 * Module dependencies
 */

var extend = require('tea-extend');
var net = require('net');

/*!
 * Primary export is a function to memoize
 * the type as the default `type` of balancer
 * in schema.
 *
 * @param {String} type name
 * @return {Object} schema
 * @api public
 */

module.exports = function(type) {
  return {
      port: { type: Number, required: true }
    , name: { type: String, required: true, length: { min: 4, max: 128 }}
    , type: { type: String, required: true, default: type }
    , strategy: { type: String, default: 'random' }
    , ips: { type: Array, length: { min: 1 }, required: true, validate: validateIPs, cast: castIPs }
  };
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

function validateIPs(ips, spec, assert) {
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

function castIPs(ips, spec, assert) {
  return ips.map(function(ip) {
    var version = net.isIPv6(ip) ? 'IPV6' : 'IPV4';
    return { address: ip, ipVersion: version };
  });
}
