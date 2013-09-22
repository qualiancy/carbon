
var debug = require('sherlock')('carbon:balancer:http');
var inherits = require('util').inherits;


var Base = require('./_base');

module.exports = HttpBalancer;

function HttpBalancer(app, opts) {
  Base.call(this, app, 'http', opts);
}

inherits(HttpBalancer, Base);

HttpBalancer.prototype._handle = function(req, res, next) {
  debug('(handle)');

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
