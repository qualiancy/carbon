var http = require('http')
  , https = require('https')
  , fs = require('fs')
  , path = require('path')
  , keys = path.join(__dirname, '../test/fixtures/keys')
  , carbon = require('..');

var opts = {
    key: fs.readFileSync(path.join(keys, 'agent-key.pem'), 'utf8')
  , cert: fs.readFileSync(path.join(keys, 'agent-cert.pem'), 'utf8')
}

var httpsProxy = https.createServer(opts).listen(9001);

var proxy = carbon.listen(httpsProxy);

proxy.use(function (res, res, next) {
  next(9000, null);
});

var app = http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('Hello Secure Universe');
  res.end();
}).listen(9000);
