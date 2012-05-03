var should = require('chai').should()
  , http = require('http')
  , join = require('path').join
  , request = require('superagent')
  , carbon = require('..');

function after(n, fn) {
  return function () {
    --n || fn.apply(null, arguments);
  }
}

describe('Middleware#balancer', function () {

  var serv = http.createServer()
    , proxy = carbon.listen(serv);

  process.env.BALANCERTEST = 'foobar';

  proxy.use(carbon.balancer(
      join(__dirname, 'fixtures', 'balancer.js')
    , { host: 'localhost' }
  ).middleware);

  proxy.use(carbon.balancer(
      join(__dirname, 'fixtures', 'balancer2.js')
    , { host: '127.0.0.1' }
  ).middleware);

  before(function (done) {
    serv.listen(4170, done);
  });

  after(function (done) {
    serv.on('close', done);
    serv.close();
  });

  it('should round robin the requests');

  it('should pass env variable to children', function (done) {
    request
      .get('localhost:4170/env')
      .end(function (res) {
        res.text.should.equal('foobar');
        done();
      });
  });

  it('should allow for multiple balancers', function (done) {
    var next = after(2, done);

    request
      .get('localhost:4170/inst')
      .end(function (res) {
        res.text.should.equal('1');
        next();
      });

    request
      .get('127.0.0.1:4170/inst')
      .end(function (res) {
        res.text.should.equal('2');
        next();
      });
  });
});
