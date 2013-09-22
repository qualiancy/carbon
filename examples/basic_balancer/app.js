var carbon = require('../..');
var app = carbon();

var server = require('./server');
var sone = server('one[9090]').listen(9090);
var stwo = server('two[9091]').listen(9091);
var sthr = server('three[9092]').listen(9092);

var balancer = app.balancers.create('http', 'universe', {
    port: 8080
  , strategy: 'round robin'
  , virtualIPs: [ '192.168.1.118' ]
});

balancer.host('logicalarch');

balancer.shards.create(9090, 'localhost').enable();
balancer.shards.create(9091, 'localhost').enable();
balancer.shards.create(9092, 'localhost').enable();

balancer.start();

/*
setTimeout(function() {
  balancer.stop();
  setTimeout(function() {
    console.log('timeout');
  }, 20 * 1000);
}, 10000);
*/
