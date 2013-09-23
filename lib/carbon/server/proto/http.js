
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
