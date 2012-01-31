var http = require('http')
  , carbon = require('..')
  , proxy = carbon.listen(8080);

var table = [
    { hostname: 'proxyone.com:8080'
    , port: 8000 }
  , { hostname: 'proxytwo.com:8080'
    , dest: 'localhost:1227' }
];

http.createServer(function (req, res) {
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.write('proxy server one');
  res.end();
}).listen(8000);

http.createServer(function (req, res) {
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.write('proxy server two');
  res.end();
}).listen(1227);

proxy.use(carbon.proxyTable(table));
console.log('Proxy server active on port %d', proxy.server.address().port);
