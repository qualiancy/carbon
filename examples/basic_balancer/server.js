
var http = require('http');

module.exports = function(name) {
  var count = 0;
  return http.createServer(function(req, res) {
    count++;
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.write('hello universe - ' + name + ' - ' + count + '\n');
    res.end();
  });
};
