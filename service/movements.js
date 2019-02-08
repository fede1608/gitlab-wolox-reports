const R = require('ramda');

const parseNotesToMovements = R.map(note => {
  const { action, label: { id, name }, created_at: date } = note;
  return { id, name, date, action };
});

const groupMovementsByName = R.groupBy(R.prop('name'));

module.exports = R.pipe(
  R.filter(note => note.label),
  parseNotesToMovements,
  groupMovementsByName
);
