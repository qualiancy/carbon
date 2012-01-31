var carbon = require('..')
  , proxy = carbon.listen(8080);

var table = [
    { hostname: 'qualiancy.com'
    , port: 8000 }
  , { hostname: 'alogicalparadox.com'
    , port: 1227 }
];

proxy.use(carbon.proxyTable(table));
