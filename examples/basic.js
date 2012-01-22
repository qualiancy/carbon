var http = require('http')
  , carbon = require('..');

var server = http.createServer().listen(8000)
  , balancer = new carbon.Stack(server);

balancer.use(function (req, res, next) {
  res.writeHead(200);
  res.write('Hello World');
  res.end();
  next(9000);
});

http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('Hello World');
  res.end();
}).listen(9000);
