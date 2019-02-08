const R = require('ramda');
const moment = require('moment');

exports.average = R.converge(R.divide, [R.sum, R.length]);

exports.getLastDate = (dateA, dateB) => (moment(dateA) > moment(dateB) ? dateA : dateB);

exports.getFirstActionByName = (name, movements) => R.find(R.propEq('action', name), movements || []);

exports.parseTime = milli => {
  if (milli === undefined || milli === null || isNaN(milli)) return 'null';
  const fmt = new Date(milli).toISOString().slice(11, -5);
  if (milli >= 8.64e7) { /* >= 24 hours */
    const parts = fmt.split(/:(?=\d{2}:)/);
    parts[0] -= -24 * (milli / 8.64e7 | 0);
    return parts.join(':');
  }
  return fmt;
};

exports.getFirstNoteDateByAction = (notes, name, action) => {
  return notes[name] && notes[name]
    .filter(n => n.action === action)
    .reduce((prev, curr) => {
      if (!prev || moment(curr.date) < prev) {
        prev = moment(curr.date);
      }
      return prev;
    }, null);
};
