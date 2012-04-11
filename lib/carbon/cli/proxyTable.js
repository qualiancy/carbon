/*!
 * Carbon - cli proxy table
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Help descriptor
 */

cli.register({
    name: 'proxy'
  , description: 'Proxy using a proxy table JSON file'
  , options: {
        '-f, --file': 'Specify the proxy file to use. Required'
      , '-p, --port [8080]': 'The port the proxy will listen on.'
    }
});

/**
 * # proxyByTable
 *
 * We are lazy loading everything we need to
 * create a proxy table.
 *
 * @param {Object} optimist parsed cmd args
 */

cli.on('proxy', function proxyByTable (args) {
  var fs = require('fs')
    , path = require('path')
    , exst = fs.existsSync || path.existsSync
    , _ = require('../utils')
    , tea = require('tea')
    , carbon = require('../../carbon');

  // our logger
  var log = new tea.Logger({
    'namespace': 'proxy-table'
  });

  log.info('Welcome to Carbon:ProxyTable');
  log.info('It works if it ends with ProxyTable ok');

  // check for proxy table required fields
  if (!args.f && !args.file) {
    log.error('[-f, --file] parameter require');
    log.warn('ProxyTable not ok');
    process.exit(1);
  }

  // parse our args for passing to proxy/table
  var file = args.f || args.file
    , port = args.p || args.port || 8080
    , table = [];

  if (!_.isPathAbsolute(file)) {
    file = path.resolve(args.cwd, file);
  }

  // load proxy table
  if (!exst(file)) {
    log.error('Proxy table file does not exist.');
    log.warn('ProxyTable not ok');
    process.exit(1);
  }

  try {
    table = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    log.error('Unable to parse proxy table file.');
    log.warn('ProxyTable not ok');
    process.exit(1);
  }

  var proxy = carbon.listen(port);
  proxy.use(carbon.proxyTable(table));

  log.info('Proxy running on port [' + port + ']');
});
