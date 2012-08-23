var should = require('chai').should()
  , request = require('superagent')
  , http = require('http');

var carbon = require('..')
  , utils = require('../lib/carbon/utils');

describe('main exports', function () {

  it('should have a valid version', function () {
    carbon.version.should.match(/^\d+\.\d+\.\d+$/);
  });

  it('should create an http server to #listen on', function (done) {
    var proxy = carbon.listen(4100, { nolog: true }, function () {
      proxy.server.should.be.instanceof(http.Server);
      proxy.server.on('close', done);
      proxy.server.close();
    });
  });

  it('should #attach an exist http server', function (done) {
    var server = http.createServer()
      , proxy = carbon.listen(server, { nolog: true });
    proxy.server.should.eql(server);
    done();
  });

});
