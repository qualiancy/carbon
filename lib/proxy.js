var util = require('util')
  , http = require('http')
  , Drip = require('drip');

module.exports = Proxy;

function Proxy () {
  Drip.call(this);
}

util.inherits(Proxy, Drip);

Proxy.prototype.proxyRequest = function (req, res, opts) {
  var out = {};

  out.host = opts.host;
  out.port = opts.port;
  out.method = req.method;
  out.path = req.url;
  out.headers = req.headers;

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
