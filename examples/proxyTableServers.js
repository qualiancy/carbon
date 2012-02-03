var http = require('http');

http.createServer(function (req, res) {
  console.log('request to proxy server one');
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.write('proxy server one');
  res.end();
}).listen(8000);

http.createServer(function (req, res) {
  console.log('request to proxy server two');
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.write('proxy server two');
  res.end();
}).listen(1227);

console.log('proxy one 8000');
console.log('proxy two 1227');
