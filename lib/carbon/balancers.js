
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

Balancers.prototype.create = function(type, name, opts) {
  // TODO throw err
  if (this.has(name)) return null;

  var spec = extend({}, opts || {}, { name: name, type: type });
  var balancer = balancers.create(this.app, spec);
  this.set(name, balancer);
  return balancer;
};
