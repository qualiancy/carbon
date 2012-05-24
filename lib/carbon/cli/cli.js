exports.colorize = function () {
  var colors = {
      'red': '\u001b[31m'
    , 'green': '\u001b[32m'
    , 'yellow': '\u001b[33m'
    , 'blue': '\u001b[34m'
    , 'magenta': '\u001b[35m'
    , 'cyan': '\u001b[36m'
    , 'gray': '\u001b[90m'
    , 'reset': '\u001b[0m'
  };

  Object.keys(colors).forEach(function (color) {
    Object.defineProperty(String.prototype, color,
      { get: function () {
          return colors[color]
            + this
            + colors['reset'];
        }
    });
  });
};

exports.header = function () {
  exports.colorize();
  console.log('info'.green + ':  Welcome to ' + 'Carbon'.gray);
  console.log('info'.green + ':  It worked if it ends with ' + 'Carbon'.gray + ' ok'.green);
};

exports.footerOk = function () {
  console.log('info'.green + ':  ' + 'Carbon '.gray + 'ok'.green);
  process.exit();
};

exports.footerNotOk = function () {
  console.log('info'.green + ':  ' + 'Carbon '.gray + 'not ok'.red);
  process.exit(1);
};
