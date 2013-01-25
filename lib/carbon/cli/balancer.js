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

program
  .command('balance')
  .description('Balance an exported node.js compatible server')
  .option('-s, --server', 'Specify the main server file (required).')
  .option('-h, --host [localhost]', 'Hostname associated with your server.')
  .option('-p, --port [8080]', 'The port the proxy will listen on.')
  .option('-m, --max [cpus]', 'Number of workers to spawn.')
  .action(startBalancer);

/**
 * # startBalancer
 *
 * We are lazy loading everything we need to
 * create a balancer.
 *
 * @param {Object} optimist parsed cmd args
 */

function startBalancer (args) {
  var fs = require('fsagent')
    , path = require('path');

  var carbon = require('../../carbon')
    , cli = require('./cli')

  cli.header();

  // parse our args for passing to proxy/balaner
  var server = args.param('s', 'server') || null
    , host = args.param('h', 'host') || 'localhost'
    , port = args.param('p', 'port') || 8080
    , options = {
          maxWorkers: args.param('m', 'max') || cpus
        , watch: true
      };

  // check for server arg requirement
  if (!server) {
    console.log('error'.red + ': [-s, --server] parameter required');
    cli.footerNotOk();
  }

  if (!fs.isPathAbsolute(server)) {
    server = path.resolve(args.cwd, server);
  }

  // start everything up.
  var proxy = carbon.listen(port)
    , balancer = carbon.balancer(host, server, options);

  proxy.use(balancer);
  proxy.ws.use(balancer);

  console.log('info'.green + ':  Proxy running on port [' + port.toString().blue + ']');
  console.log('info'.green + ':  Redirecting traffic for [' + options.host.blue + '] to your server.');
}
