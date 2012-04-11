var should = require('chai').should()
  , http = require('http')
  , request = require('superagent')
  , carbon = require('..');

function after(n, fn) {
  return function () {
    --n || fn.apply(null, arguments);
  }
}

describe('Middleware#stats', function () {
  var stats = carbon.stats({
    store: new carbon.stats.MemoryStore()
  });

  var app = http.createServer(function (req, res) {
    setTimeout(function() {
      res.writeHeader(200, { 'content-type': 'text/plain' });
      res.write('Hello Universe');
      res.end();
    }, 15);
  });

  var serv = http.createServer()
    , proxy = carbon.listen(serv);

  proxy.use(stats.middleware());
  proxy.use(function (req, res, next) {
    if (req.url == '/hello') return next(4169);
    next();
  });

  before(function (done) {
    var next = after(2, done);
    app.listen(4169, next);
    serv.listen(4168, next);
  });

  after(function (done) {
    var next = after(2, done);
    app.on('close', next);
    serv.on('close', next);
    app.close();
    serv.close();
  });

  it('should mark on a request', function (done) {
    request
      .get('localhost:4168')
      .end(function (res) {
        stats.store.markTotal('request').should.equal(1);
        stats.store.markTotal('missed').should.equal(1);
        done();
      });
  });

  it('should measure response time on a proxy hit', function (done) {
    should.not.exist(stats.store.diffTotal('response'));
    request
      .get('localhost:4168/hello')
      .end(function (res) {
        stats.store.markTotal('request').should.equal(2);
        stats.store.markTotal('missed').should.equal(1);
        stats.store.diffTotal('response').should.equal(1);
        stats.store.diffAvg('response').should.be.above(14);
        done();
      });
  });
});
