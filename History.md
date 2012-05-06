
0.2.2 / 2012-05-06 
==================

  * logging middleware example
  * logging middleware
  * adding quantum logger
  * remove tea dependancy

0.2.1 / 2012-05-03 
==================

  * balancer abide by `watch` option

0.2.0 / 2012-05-03 
==================

  * Merge branch 'feature/expose-balancer'
  * update tests for balancer middleware
  * balancer middle returns master instance. use balancer.middleware as `use`statement
  * mocha opts for watch testing

0.1.0 / 2012-04-11 
==================

  * [refactor] balancer worker handlers are private
  * [refactor] main export listen now supports constructed server. removed #attach
  * [feature] cli help formatting
  * [attr] comments and code attribution for proxyRequest
  * [feature] added NODE_ENV based Proxy#configure
  * [refactor] Proxy#ws / Proxy#error are now either chainable or direct functions.
  * Code commenting.
  * [refactor] privatize api for a majority of Proxy methods
  * read me update
  * update email in license headers
  * use cli global and not exports. also, cli.register for creating help entries
  * moar readme
  * readme updates

0.0.10 / 2012-03-09 
==================

  * small tweaks to proxyRequest
  * balancer throw error if missing configuration option
  * proxyRequest x-forwarded-___ headers typo
  * added proxyRequest test for 'POST' method
  * npm ignore coverage items
  * tests for proxytable
  * proxyTable now roundRobin balances requests
  * mistype in balancer test
  * added dev sep for chai-http

0.0.9 / 2012-03-05 
==================

  * socketio integration tests
  * [tests] empty socket.io tests
  * [examples] socket.io
  * [proxyrequest] added socket.io parsing
  * [exampes/test] added socket.io dep

0.0.8 / 2012-03-03 
==================

  * [bug] overwriting Worker#spawn method. #2
  * [test] change server port to prevent collision
  * [tests] multiple balancer. Closes #2
  * [balancer-worker] support restarting
  * [balancer-master] refactor spawnWorker for smarter starting
  * [balancer-spawn] should exit on error
  * [examples] added 2nd balancer
  * [balancer master] #getNextWorker is async to give process time to start up
  * [balancer] copy all env variables to forked process. Closes #1
  * balancer test + fixtures

0.0.7 / 2012-03-03 
==================

  * allow for env copy to worker process

0.0.6 / 2012-02-24 
==================

  * added test coverage support
  * package update
  * Merge branch 'feature/ws'
  * tests for proxy using websockets
  * handle upgrade fixes
  * refactored proxy `use` to support web sockets and errors
  * http upgrade handler for ws
  * more default errors
  * proxyRequest has basic ws support!
  * clearn proxyrequest
  * separating http from websocket

0.0.5 / 2012-02-03 
==================

  * quick fix to port finder to prevent super race conditions
  * balancer supports wildcard

0.0.4 / 2012-02-03 
==================

  * no downtime restarts!
  * readme update
  * all commented up
  * proxy table cli
  * proxyTable better aware of ports
  * cli for balancer checkpoint
  * added is path absolute utility
  * cli checkpoint
  * adding in tea for cli output
  * balancer checkpoint
  * update debug
  * balancer middleware checkpoint
  * update to spawn message debug
  * balancer worker
  * balancer example
  * balancer spawn
  * better tests cleanups
  * added port finder utility
  * starting balancer middleware
  * tons of commenting
  * stats middleware debuggable
  * added cache placeholder
  * proxy table debuggable
  * added debug module
  * basic example works again

0.0.3 / 2012-02-01 
==================

  * stats middleware + tests
  * proper event emitting for proxy start and proxy end on `req/res`
  * added stats middleware
  * addendum to renaming .. Stack now is Proxy
  * added hakaru
  * [refactor] renaming of internals
  * apply context to stack execution
  * proxy table and example
  * middleware loader
  * proxytable example
  * added starting middleware skeltons
  * commenting the stack
  * bit of code cleanup
  * testing

0.0.2 / 2012-01-27 
==================

  * remove debug messages for now
  * added example routefile

0.0.1 / 2012-01-26 
==================

  * experimental
  * util typo
  * stock sens buffer
  * proxy works with buffer
  * [bug] missing } in utils
  * added bin
  * added basic proxy tests
  * added support in stack for option 'no log' to turn off console logging
  * added super agent for request testing
  * added basic carbon tests
  * cleaner stack tests
  * added listen / attach helpers to main export
  * rearranged folder structure
  * removed route
  * starting tests
  * if no server provided throw error
  * [stack] moved logger back to this.log
  * proper headers for proxyRequest
  * take out console.logs
  * added buffer util
  * updated stack to use proxy
  * added proxyRequest
  * updated example
  * moved logger to global
  * added example
  * added expected modules
  * project init
