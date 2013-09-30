
var debug = require('sherlock')('carbon:strategy:round_robin');

/*!
 * @param {Shards} hash of shards
 * @param {Function} callback
 * @cb {Error|null} if error
 * @cb {Shard} resulting shard
 */

module.exports = function roundRobin(shards, cb) {
  var online = shards.byState('enabled');
  var role = online.find({ role: 'primary' });

  if (!role.length) {
    debug('filter: primary empty');
    role = online.find({ role: 'secondary' });
  }

  if (!role.length) {
    debug('filter: secondary empty');
    return cb(null, null);
  }

  var sorted = role.sort();
  var last = shards.state.get('lastId');

  function done(shard) {
    debug('result: %j', shard.address());
    shards.state.set('lastId', shard.id);
    cb(null, shard);
  }

  if (!last) {
    shard = shards.at(0);
    return done(shards.at(0));
  }

  var pos = role.index(last);
  var i = (pos == role.length - 1) ? 0 : pos + 1;
  return done(role.at(i));
};
