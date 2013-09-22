var carbon = require('../..');
var app = carbon();

var opts = { host: '192.168.1.118', port: 8080, type: 'http' };

function handle(req, res, next) {
  var start;

  res.proxyState.on('proxy:start', function() {
    start = new Date().getTime();
  });

  res.proxyState.on('proxy:end', function() {
    var end = new Date().getTime();
    var elapsed = end - start;
    console.log('  proxy elapsed', elapsed);
  });

  next(null, { port: 8081 });
}

app.servers.findOrCreate(opts, function(err, server) {
  if (err) throw err;
  server.use(handle);
});

require('http')
  .createServer(function(req, res) {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.write('hello universe\n');
    res.write(JSON.stringify(req.headers));
    res.end();
  })
  .listen(8081);
