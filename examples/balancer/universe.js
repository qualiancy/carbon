var http = require('http');

module.exports = http.createServer(function (req, res) {
  res.writeHead(200, { 'content-type': 'text/html' });
  res.write('Hello Universe</br>');
  res.write('' + this.address().port);
  res.end();
});
