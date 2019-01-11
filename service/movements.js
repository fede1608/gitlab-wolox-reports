const R = require('ramda');

const parseNotesToMovements = R.map(note => {
  const { action, label: { id, name }, created_at: date } = note;
  return { id, name, date, action };
});

const groupMovementsById = R.groupBy(R.prop('id'));

module.exports = R.pipe(
  parseNotesToMovements,
  groupMovementsById
);
