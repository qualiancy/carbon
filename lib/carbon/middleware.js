
// a little trick from express
exports.init = function (proxy) {
  return function (req, res, next) {
    req.proxy = res.proxy = proxy;
    req.res = res;
    res.req = res;
    next();
  };
};

exports.defaultHttp = function (req, res) {
  req.emit('proxy miss');
  res.writeHead(501);
  res.end();
};

exports.defaultHttpError = function (err, req, res) {
  req.emit('proxy error');
  res.writeHead(500);
  res.end();
};

exports.defaultWs = function (req, socket) {
  req.emit('proxy ws miss');
  socket.end();
};

exports.defaultWsError = function (err, req, socket) {
  req.emit('proxy ws error');
  socket.end();
};
