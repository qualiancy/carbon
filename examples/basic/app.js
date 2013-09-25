var carbon = require('../..');

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

carbon.createServer('http', { port: 8080 }, function(err, server) {
  if (err) throw err;
  server.listen(function(err) {
    if (err) throw err;
    server.use(handle);
    console.log(server.state, server.address());
  });
});

require('http')
  .createServer(function(req, res) {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.write('hello universe\n');
    res.write(JSON.stringify(req.headers));
    res.end();
  })
  .listen(8081);
