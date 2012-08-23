var http = require('http')
  , carbon = require('../..')

var server = module.exports = http.createServer()
  , proxy = carbon.listen(server);

// make a change to world and it will reload :)
proxy.use(carbon.balancer('*', __dirname + '/world.js', { watch: true }));

// make a change to universe and it will reload :)
proxy.use(carbon.balancer('*', __dirname + '/universe.js', { watch: true }))

if (require.main === module) {
  server.listen(8080);
}
