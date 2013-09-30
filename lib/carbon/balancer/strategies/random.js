
var debug = require('sherlock')('carbon:strategy:random');

/*!
 * @param {Shards} hash of shards
 * @param {Function} callback
 * @cb {Error|null} if error
 * @cb {Shard} resulting shard
 */

module.exports = function random(shards, cb) {
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

  var len = role.length;
  var rand = Math.floor(Math.random() * len);
  var shard = role.at(rand);
  debug('result: %j', shard.address());
  cb(null, shard);
};
