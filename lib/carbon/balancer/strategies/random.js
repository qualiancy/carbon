
var debug = require('sherlock')('carbon:strategy:random');

/*!
 * @param {Shards} hash of shards
 * @param {Function} callback
 * @cb {Error|null} if error
 * @cb {Shard} resulting shard
 */

module.exports = function random(shards, cb) {
  var online = shards.byCondition('enabled');
  var role = online.byRole('primary');

  if (!role.length) {
    debug('filter: primary empty');
    role = online.byRole('secondary');
  }

  if (!role.length) {
    debug('filter: secondary empty');
    return cb(null, null);
  }

  var len = role.length;
  var rand = Math.floor(Math.random() * len);
  var shard = role.at(rand);
  debug('result: %j', shard.address());
  cb(null, shard);
};
