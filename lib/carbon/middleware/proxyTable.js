var env = process.env.NODE_ENV;

exports = module.exports = function (table) {
  var routes = Object.create(null);

  table.forEach(function (route) {
    if (route.port) {
      if (!route.hostname) route.hostname = 'localhost';
      routes[route.hostname] = route.hostname + ':' + route.port;
    }
  });

  return function (req, res, next) {
    var go = routes[req.headers.host];
    if (go) return next(go);
    next();
  };
};
