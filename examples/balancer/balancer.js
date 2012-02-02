var carbon = require('../..')

var proxy = carbon.listen(4567);

proxy.use(carbon.balancer(__dirname + '/universe.js'));

