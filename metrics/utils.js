const R = require('ramda');

exports.average = R.converge(R.divide, [R.sum, R.length]);

exports.getLastDate = (dateA, dateB) => (dateA > dateB ? dateA : dateB);

exports.getFirstActionByName = (name, movements) => R.find(R.propEq('action', name), movements);
