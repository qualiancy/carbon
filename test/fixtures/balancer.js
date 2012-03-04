module.exports = require('http').createServer(function (req, res) {
  switch (req.url) {
    case '/env':
      res.writeHeader(200, { 'content-type' : 'text/plain' });
      res.end(process.env.BALANCERTEST);
      break;
  }
});
