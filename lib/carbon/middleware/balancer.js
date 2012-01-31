
var env = process.env.NODE_ENV;

exports = module.exports = balancer;

function balancer (server, options) {
  options = options || {};
  return function (req, res, next) {
    next();
  }
}
