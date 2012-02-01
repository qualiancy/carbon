
// a little trick from express
exports.init = function (proxy) {
  return function (req, res, next) {
    req.proxy = res.proxy = proxy;
    req.res = res;
    res.req = res;
    next();
  };
};
