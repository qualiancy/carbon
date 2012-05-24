/*!
 * Carbon - cli proxy table
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Help descriptor
 */

program
  .command('proxy')
  .description('Proxy using a proxy table JSON file')
  .option('-f, --file', 'Specify the proxy file to use. Required')
  .option('-p, --port [8080]', 'The port the proxy will listen on.')
  .action(proxyByTable);

/**
 * # proxyByTable
 *
 * We are lazy loading everything we need to
 * create a proxy table.
 *
 * @param {Object} optimist parsed cmd args
 */

function proxyByTable (args) {
  var fs = require('fs')
    , path = require('path')
    , exst = fs.existsSync || path.existsSync
    , cli = require('./cli')
    , _ = require('../utils')
    , carbon = require('../../carbon');

  cli.header();

  // parse our args for passing to proxy/table
  var file = args.param('f', 'file') || null
    , port = args.param('p', 'port') || 8080
    , table = [];

  // check for proxy table required fields
  if (!file) {
    console.log('error'.red + ': [-f, --file] parameter require');
    cli.footerNotOk();
  }

  if (!_.isPathAbsolute(file))
    file = path.resolve(args.cwd, file);

  // load proxy table
  if (!exst(file)) {
    console.log('error'.red + ': Proxy table file does not exist.');
    cli.footerNotOk();
  }

  try {
    table = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.log('error'.red + ': Unable to parse proxy table file.');
    cli.footerNotOk();
  }

  var proxy = carbon.listen(port);
  proxy.use(carbon.proxyTable(table));

  console.log('info'.green + ':  Proxy running on port [' + port.toString().blue + ']');
}
