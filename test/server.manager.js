describe('server manager', function() {
  var manager = __carbon.serverManager;

  describe('.list()', function() {
    it('returns list of defined server ctors', function() {
      manager.list().should.be.an('array');
      manager.list().should.include('base');
    });
  });

  describe('.has(key)', function() {
    it('returns boolean indicating existence', function() {
      manager.has('base').should.be.true;
      manager.has('__noop__').should.be.false;
    });
  });

  describe('.define(type, spec)', function() {
    it('throws if validation fails', function() {
      (function() { manager.define(); })
        .should.throw(/server type required/);
      (function() { manager.define('base'); })
        .should.throw(/server name already defined/);
      (function() { manager.define('__err', 'spec'); })
        .should.throw(/server spec required/);
      (function() { manager.define('__err', { inherits: '__blah' }); })
        .should.throw(/server inheritance unknown/);
    });
  });

  describe('.create()', function() {
    var CREATE_OPTS = {
        address: '127.0.0.1'
      , port: 5000
      , created: 'universe'
    };

    before(function() {
      manager.define('test_manager_create', {
          proto: { _init: function() {}, createProto: true }
        , options: { created: { type: String, required: true } }
      });
    });

    it('resolves server if validation passes', function(done) {
      manager.create('test_manager_create', CREATE_OPTS, function(err, server) {
        should.not.exist(err);
        done();
      });
    });

    it('resolves error if validation fails', function(done) {
      manager.create('test_manager_create', {}, function(err, server) {
        should.exist(err);
        err.should.have.property('message').match(/when validating options/);
        err.should.have.property('errors').an('array');
        done();
      });
    });

    describe('resolved server', function() {
      var server;

      before(function(done) {
        manager.create('test_manager_create', CREATE_OPTS, function(err, _server) {
          if (err) throw err;
          server = _server;
          done();
        });
      });

      it('has a schema attached', function() {
        server.should.have.property('__schema')
          .with.keys('address', 'port', 'type', 'created');
      });

      it('has extended prototype', function() {
        server.should.itself.respondTo('_init');
        (function() { server._init(); }).should.not.throw();
        server.should.have.property('createProto', true);
      });
    });
  });
});
