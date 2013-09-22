/*!
 * Carbon
 * Copyright (c) 2012-2013 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

var Application = require('./carbon/application');

var exports = module.exports = createApplication;

exports.version = '1.0.0-pre';
exports.Application = Application;

function createApplication() {
  return new Application();
}
