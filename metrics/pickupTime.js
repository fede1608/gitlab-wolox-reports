/**
 * pickupTime
 * @param { issue } issue
 * @return { integer }
 */

const R = require('ramda');

const {
  getFirstActionByName,
  getLastDate
} = require('./utils');

const TODO_LABEL = 'TODO';
const DOING_LABEL = 'DOING';

const filterNecessaryData = issue => {
  const {
    movements: { TODO, DOING },
    milestone: sprint,
    created_at: createdAt
  } = issue;

  return { movements: { TODO, DOING }, sprint, createdAt };
};

const pickupTime = ({ movements, sprint: { start_date: sprintStartDate }, createdAt }) => {
  const initialTime = R.prop('date', getFirstActionByName('add', movements[TODO_LABEL]))
    || getLastDate(sprintStartDate, createdAt);
  const finalTime = R.prop('date', getFirstActionByName('add', movements[DOING_LABEL]));

  return R.max(new Date(finalTime) - new Date(initialTime), 0);
};

const issuePickupTime = R.pipe(
  filterNecessaryData,
  pickupTime
);

module.exports = issuePickupTime;
