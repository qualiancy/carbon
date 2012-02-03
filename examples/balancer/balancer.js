var http = require('http')
  , carbon = require('../..')

var server = module.exports = http.createServer()
  , proxy = carbon.attach(server);

// make a change to universe and it will reload :)
proxy.use(carbon.balancer(__dirname + '/universe.js'));

if (require.main === module) {
  server.listen(8080);
}
