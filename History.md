
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
