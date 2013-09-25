
var debug = require('sherlock')('carbon:balancers');
var extend = require('tea-extend');
var Hash = require('gaia-hash').Hash;
var inherits = require('util').inherits;

var balancers = require('./balancer');

module.exports = Balancers;

function Balancers(app) {
  Hash.call(this, null, { findRoot: '_balancerStore.settings' });
  this.app = app;
}

inherits(Balancers, Hash);

Balancers.prototype.findOrCreate = function(type, name, opts, cb) {
  if ('number' === typeof opts) opts = { port: opts };
  var err;

  function done(ex, res) {
    setImmediate(function() { cb(ex, res); });
  }

  if (!balancers.has(type)) {
    err = new Error('Server type of "' + type + '" does not exist.');
    return done(err);
  }

  var self = this;
  var balancer = this.get(name);

  if (balancer && type !== balancer.get('type')) {
    err = new Error('Balancer named "' + name + '" found but wrong type.');
    return done(err);
  } else if (balancer) {
    return done(null, balancer);
  }

  opts = extend({}, opts || {}, { name: name });
  balancers.create(this.app, type, opts, function(err, balancer) {
    if (err) return cb(err);
    self.set(name, balancer);
    cb(null, balancer);
  });
};
