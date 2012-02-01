var should = require('chai').should()
  , http = require('http')
  , request = require('superagent')
  , carbon = require('..');

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
    , proxy = carbon.attach(serv);

  proxy.use(stats.middleware());
  proxy.use(function (req, res, next) {
    if (req.url == '/hello') return next(4169);
    next();
  });

  before(function (done) {
    app.listen(4169, function() {
      serv.listen(4168, done);
    });
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
