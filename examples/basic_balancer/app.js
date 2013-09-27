var carbon = require('../..');
var visor = carbon();

var target = require('./server');

var targets = {
    9090: target('9090')
  , 9091: target('9091')
  , 9092: target('9092')
};

var opts = {
    port: 8080
  , strategy: 'round robin'
  , ips: [ '192.168.1.118' ]
};

visor.createBalancer('http', 'universe', opts, function(err, balancer) {
  if (err) {
    console.error('createBalancer failed:');
    console.error(err.errors);
    return process.exit(1);
  }

  Object.keys(targets).forEach(function(port) {
    var target = targets[port];
    var shard = balancer.shards.create(port, 'localhost');
    target.listen(port);
    shard.enable();
  });

  balancer.start();

  /*
  setTimeout(function() {
    balancer.stop();
    setTimeout(function() {
      console.log('timeout');
    }, 20 * 1000);
  }, 10000);
  */
});

visor.on('balancer:create', function (balancer) {
  console.log('balancer created:', balancer.get('name'), balancer.get('port'));

  balancer.on('started', function() {
    console.log('balancer started:', balancer.get('name'), balancer.get('port'));
  });

  balancer.on('shard:create', function(shard) {
    console.log('shard created:', shard.address());

    shard.on('enabled', function() {
      console.log('shard enabled:', shard.address());
    });

    shard.on('disabled', function() {
      console.log('shard disabled:', shard.address());
    });
  });
});

visor.on('server:create', function(server) {
  console.log('server created:', server.get('address'), server.get('port'));

  server.on('listening', function(port, address) {
    console.log('server listening:', address, port);
  });
});
