
var Drip = require('drip')
  , tea = require('tea')
  , carbon = require('../carbon');

var cli = new Drip({ delimeter: ' ' })
  , help = [];

cli.on('--register', function (_help) {
  help.push(_help);
});

cli.on('--help', function (args) {
  console.log(help);
});

cli.on('--version', function () {
  console.log(carbon.version);
});

require('./cli/proxyTable')(cli);
require('./cli/balancer')(cli);

module.exports = function (command, args) {
  if (command.length == 0) {
    if (args.v || args.version) command = '--version';
    if (args.h || args.help) command = '--help';
  }
  cli.emit(command, args);
};
