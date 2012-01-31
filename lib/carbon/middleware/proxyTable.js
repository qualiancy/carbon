var env = process.env.NODE_ENV;

exports = module.exports = function (table) {
  var routes = Object.create(null);

  table.forEach(function (route) {
    if (route.port) {
      routes[route.hostname] = route.port
    } else if (route.dest) {
      routes[route.hostname] = route.dest;
    }
  });

  return function (req, res, next) {
    var prox = routes[req.headers.host];
    if (prox && 'string' === typeof prox) {
      prox = prox.split(':');
      return next(prox[1] || 80, prox[0]);
    } else if (prox) {
      return next(prox);
    }
    next();
  };
};
