
/*!
 * Module dependencies
 */

var debug = require('sherlock')('carbon:balancer:http');

/**
 * #### .host(name[, name, ...])
 *
 * Add a host to test again incoming request.
 *
 * @param {String} hostname ...
 * @return this
 * @api public
 */

exports.host = function() {
  var args = [].slice.call(arguments);
  var hostnames = this.get('hostnames') || [];

  args.forEach(function(host) {
    host = hostNormalize(host);
    host.name = hostParse(host.name);
    debug('(host) add: %s %d', host.name.toString(), host.port);
    hostnames.push(host);
  });

  this._balancerStore.set('hostnames', hostnames);
  return this;
};

/*!
 * Handle hook again base.
 *
 * @param {Request} request
 * @param {Response} response
 * @param {Function} next
 * @api private
 */

exports._handle = function(req, res, next) {
  debug('(handle)');
  var host = req.headers.host;
  var hostnames = this.get('hostnames') || [];
  var port = this.get('port');

  if (hostnames.length && !hostMatches(hostnames, host)) {
    debug('(handle) no host match: %s', host);
    return next();
  }

  this.shards.next(function(err, shard) {
    if (err || !shard) return next();
    var opts = shard.address();
    var proxy = req.proxyState;
    var type = proxy.type;
    stats[type](proxy, shard);
    debug('(handle) hit: %j', opts);
    next(null, opts);
  });
};


/*!
 * Normalize a host string.
 *
 * @param {String} hostname string
 * @returns{String} normalized
 * @api private
 */

function hostNormalize(host) {
  if (!host || host.length === 0) return null;
  var parts = host.split(':');
  return { name: parts[0], port: (parseFloat(parts[1]) || 80) };
}

/*!
 * Convert hostname to regexp for testing.
 *
 * @param {String|RegExp} host query
 * @return {RegExp} testable
 * @api private
 */

function hostParse(name) {
  if (name instanceof RegExp) return name;
  name = name.replace(/\*/g, '(.*)');
  return new RegExp('^' + name + '$', 'i');
}

/*!
 * Test a raw host string again against
 * an array of hostname regexp to see if
 * it matches any.
 *
 * @param {Array} hostnames
 * @param {String} host to test
 * @return {Boolean} match
 * @api private
 */

function hostMatches(hostnames, host) {
  host = hostNormalize(host);
  if (!host) return false;

  var match = false;
  var i = 0;
  var re;

  for (; i < hostnames.length; i++) {
    re = hostnames[i].name;
    if (!! host.name.match(re)) {
      match = true;
      break;
    }
  }

  return match;
}

/*!
 * Scratch
 */

var stats = {};

stats.request = function(proxy, shard) {
  var type = proxy.type;
  var start;

  function onstart() {
    start = new Date().getTime();
    shard.increase(type);
  }

  function onres() {
    var elapsed = new Date().getTime() - start;
    //console.log('delay', elapsed);
  }

  function onend() {
    var elapsed = new Date().getTime() - start;
    shard.decrease(type);
    //console.log('elapsed', elapsed);
  }

  proxy.once('proxy:start', onstart);
  proxy.once('proxy:response', onres);
  proxy.once('proxy:end', onend);
};

stats.upgrade = function() {};
