
var debug = require('sherlock')('carbon:balancers');
var Hash = require('gaia-hash').Hash;
var inherits = require('util').inherits;

var balancers = require('../balancers');

module.exports = Balancers;

function Balancers(app) {
  Hash.call(this);
  this.app = app;
}

inherits(Balancers, Hash);

Balancers.prototype.create = function(protocol, id, opts) {
  opts = opts || {};
  opts.id = id;

  var balancer = new balancers[protocol](this.app, opts)
  this.set(id, balancer);
  return balancer;
};
