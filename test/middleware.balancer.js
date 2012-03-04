var sould = require('chai').should()
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
    , proxy = carbon.attach(serv);

  process.env.BALANCERTEST = 'foobar';

  proxy.use(carbon.balancer(
      join(__dirname, 'fixtures', 'balancer.js')
    , { host: 'localhost' }
  ));

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
});
