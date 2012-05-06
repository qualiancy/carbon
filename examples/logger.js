var http = require('http')
  , carbon = require('..');

var proxy = carbon.listen(8000)
  , log = carbon.logger('my-app');

log.use(carbon.logger.console());
log.start();

proxy.use(log.middleware());

proxy.use(function (req, res, next) {
  next(9000);
});

http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('Hello Universe');
  res.end();
}).listen(9000);
