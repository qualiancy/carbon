# Carbon [![build status](https://secure.travis-ci.org/qualiancy/carbon.png)](http://travis-ci.org/qualiancy/carbon)

> Middleware based proxy for table or cluster based routing.

## Features

- Node http server export balancing with file watching and no-downtime restarts
- ProxyTable routing and balancing
- Websocket / [socket.io](https://github.com/LearnBoost/socket.io) compatibible
- CLI helper for ProxyFile based routing
- Support for custom middleware

## Middleware

Carbon support many types of middlware. The bundled middlware is specifically for 
different types of balancing techniques. You can find other middleware projects
by following the links below.

#### Bundled Middleware

- **Balancer**: Given a `module.export` node compatible webserver, start `n` 
processes and balance traffic. (_Psuedo-clustering_)
- **ProxyTable**: Route requests for host to port, or balance between many ports

#### Qualiancy Middleware

- **Logging** ([qualiancy/carbon-logger](https://github.com/qualiancy/carbon-logger)): 
Multi-transport logging middleware suitable for debugging or production use.
- **Stats** ([qualiancy/carbon-stats](https://github.com/qualiancy/carbon-stats)): 
Create a stats store and measure count of hits/misses and response time. 

## Installation

    $ npm install carbon

## Usage

To get the basics, you can also check out the `examples` folder.

### Basic

Carbon allow you to build your own routing logic. In this really basic example, 
all traffic to port `8080` will be routed to port `8081`.

```js
var proxy = require('carbon').listen(8080);

proxy.use(function (req, res, next) {
  next(8081);
});

// for websockets
proxy.ws.use(function (req, res, next) {
  next(8081);
});
```

### Proxy Table

The Carbon ProxyTable middleware makes it easy to route any traffic for a specific host to a different host, port, or set of host/ports.

```js
var proxy = require('carbon').listen(8080);

// Single port proxy table
proxy.use(carbon.proxyTable([
  { hostname: 'localhost:8080'
  , port: 8081 }
]));

// Balanced proxyTable
proxy.use(carbon.proxyTable([
  { hostname: 'proxytable.com'
  , dest: [ 'localhost:9091', 9191, 'ec2-10-10-10-10:9090' ] }
]));
```

The proxyTable middleware takes an array of object definitions. If an array of `port` or `dest` is provided, requests will be round-robin
balanced for each.

### Balancer

Carbon Balancer middleware will take any node compatible http server (http, connect, express, ect..) and spawn up several node processes
and balance traffic between them. Instead of using node's clusting component, carbon will find open ports available on the system and 
instruct the webserver to listen on that port. 

To use, ensure the the server is the primary `module.export` for a given file, and pass that file to the balancer middleware.

```js
var carbon = require('carbon')
  , proxy = carbon.listen(8080);

var balancer = carbon.balancer(
    path.join(__dirname, 'app.js')
  , { host: 'localhost' // required
    , watch: true       // optional (defaults to true)
    , maxWorkers: 4     // optional (defaults to hardware cpu count)
});

// for http requests
proxy.use(balancer.middleware);

// for websocket requests
proxy.ws(balancer.middleware);
```

In this example, any traffic that goes to `localhost:8080` will be balanced between several instances of `app.js`. Balancer defaults to 
the number of CPU cores available on the current machine, but can be adjusted with options. Balancer also, by default, will watch `app.js` 
for changes and restart a new set of workers with no downtime. You can turn this off with the option `watch: false`.

## Debugging

Carbon has integrated the fantastic [debug]() module to allow for descriptive debugging. When starting any file that requires
`carbon`, include the `DEBUG` environment variable to get robust CLI output:

    DEBUG=carbon:* node proxy.js

## Tests

Tests are written in the BDD styles for the [Mocha](http://visionmedia.github.com/mocha) test runner using the
`should` assertion interface from [Chai](http://chaijs.com). Running tests is simple:

    make test


## Contributing

Interested in contributing? Fork to get started. Contact [@logicalparadox](http://github.com/logicalparadox) 
if you are interested in being regular contributor.

#### Contibutors 

* Jake Luer ([@logicalparadox](http://github.com/logicalparadox))

## Inspiration

Carbon was inspired by these modules:

- [node-http-proxy](https://github.com/nodejitsu/node-http-proxy): proxy http & websocket requests
- [distribute](https://github.com/learnboost/distribute): proxy api
- [up](https://github.com/learnboost/up): psuedo-clustering

## License

(The MIT License)

Copyright (c) 2012 Jake Luer <jake@qualiancy.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
