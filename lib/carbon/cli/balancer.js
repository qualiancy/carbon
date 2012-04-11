/*!
 * Carbon - cli balancer
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Module dependancies
 */

var cpus = require('os').cpus().length;

/*!
 * Help descriptor
 */

cli.register({
    name: 'balance'
  , description: 'Balance an exported node.js compatible server'
  , options: {
        '-s, --server': 'Specify the main server file (requred).'
      , '-h, --host [localhost]': 'Hostname associated with your server.'
      , '-p, --port [8080]': 'The port the proxy will listen on.'
      , '-m, --max [cpus]': 'Number of workers to spawn.'
    }
});

/**
 * # balance
 *
 * We are lazy loading everything we need to
 * create a balancer.
 *
 * @param {Object} optimist parsed cmd args
 */

cli.on('balance', function balance (args) {
  var path = require('path')
    , carbon = require('../../carbon')
    , _ = require('../utils')
    , tea = require('tea');

  // our logger
  var log = new tea.Logger({
    'namespace': 'balancer'
  });

  log.info('Welcome to Carbon:Balancer');
  log.info('It works if it ends with Balancer ok');

  // check for server arg requirement
  if (!args.s && !args.server) {
    log.error('[-s, --server] parameter required');
    log.warn('Balancer not ok');
    process.exit(1);
  }

  // parse our args for passing to proxy/balaner
  var server = args.s || args.server
    , port = args.p || args.port || 8080
    , options = {
          maxWorkers: args.m || args.max || cpus
        , host: args.h || args.host || 'localhost'
      };

  if (!_.isPathAbsolute(server)) {
    server = path.resolve(args.cwd, server);
  }

  // start everything up.
  var proxy = carbon.listen(port);
  proxy.use(carbon.balancer(server, options));

  log.info('Proxy running on port [' + port + ']');
  log.info('Redirecting traffic for [' + options.host + '] to your server.');
});
