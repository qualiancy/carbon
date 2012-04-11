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

  describe('utilities', function () {

    describe('portfinder', function () {
      var serv = http.createServer();
      before(function (done) {
        serv.listen(4200, done);
      });

      after(function (done) {
        serv.on('close', done);
        serv.close();
      });

      it('should be able to find a port', function (done) {
        utils.findPort({ min: 4200, max: 4205 }, function (err, port) {
          should.not.exist(err);
          port.should.equal(4201);
          done();
        });
      });

      it('should return an error if all are taken', function (done) {
        utils.findPort({ min: 4200, max: 4200 }, function (err, port) {
          err.should.be.instanceof(Error);
          done();
        });
      });
    });
  });
});
