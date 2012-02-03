// for use with proxyTableServer.js

var carbon = require('..')
  , proxy = carbon.listen(8080);

var table = require('fs').readFileSync('./routefile.json', 'utf8');
table = JSON.parse(table);

console.log(table);

proxy.use(carbon.proxyTable(table));
console.log('Proxy server active on port %d', proxy.server.address().port);
