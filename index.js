module.exports = process.env.CARBON_COV
  ? require('./lib-cov/carbon')
  : require('./lib/carbon');
