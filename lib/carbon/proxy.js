var util = require('util')
  , http = require('http')
  , Drip = require('drip');

module.exports = Proxy;

function Proxy () {
  Drip.call(this);
}

util.inherits(Proxy, Drip);

Proxy.prototype.proxyRequest = function (req, res, opts) {
  var self = this
    , out = {}
    , head = req.headers;

  if (req.connection && req.socket) {
    var xff = req.connection.remoteAddress || req.socket.remoteAddress
      , xfp = req.connection.remotePort || req.socket.remotePort
      , xfr = req.connection.pair ? 'https' : 'http';
    if (head['x-forward-for']) xff = head['x-forward-for'] + ',' + xff;
    if (head['x-forward-port']) xfp = head['x-forward-port'] + ',' + xfp;
    if (head['x-forward-proto']) xfr = head['x-forward-proto'] + ',' + xfr;
    head['x-forward-for'] = xff;
    head['x-forward-port'] = xfp;
    head['x-forward-proto'] = xfr;
  }

  out.host = opts.host;
  out.port = opts.port;
  out.method = req.method;
  out.path = req.url;
  out.headers = head;

  this.emit('start', req, res, out);

  var proxy = http.request(out, function (proxyRes) {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.on('data', function (chunk) {
      var flushed = res.write(chunk);
      if (!flushed) {
        proxyRes.pause();
        res.once('drain', function() {
          proxyRes.resume();
        });
      }
    });

    proxyRes.on('end', function () {
      res.end();
      self.emit('end', req, res);
    });
  });

  req.on('data', function (chunk) {
    var flushed = proxy.write(chunk);
    if (!flushed) {
      req.pause();
      proxy.once('drain', function () {
        req.resume();
      });
    }
  });

  req.on('end', function () {
    proxy.end();
  });
}
