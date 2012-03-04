module.exports = require('http').createServer(function (req, res) {
  switch (req.url) {
    case '/inst':
      res.writeHeader(200, { 'content-type' : 'text/plain' });
      res.end('2');
      break;
  }
});
