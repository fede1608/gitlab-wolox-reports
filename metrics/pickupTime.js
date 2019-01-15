/**
 * pickupTime
 * @param { issue } issue
 * @return { integer }
 */

const R = require('ramda');

const {
  getLastDate,
  getFirstNoteDateByAction
} = require('./utils');

const TODO_LABEL = 'TODO';
const DOING_LABEL = 'DOING';

const filterNecessaryData = issue => {
  const {
    movements: { TODO, DOING },
    milestone: sprint,
    created_at: createdAt
  } = issue;
  sprint.sprintStartDate += ' 09:00:00';
  return { movements: { TODO, DOING }, sprint, createdAt };
};

const pickupTime = ({ movements, sprint: { start_date: sprintStartDate }, createdAt }) => {
  const firstTodoTime = getFirstNoteDateByAction(movements, TODO_LABEL, 'add');
  const initialTime = firstTodoTime && firstTodoTime > sprintStartDate
    ? firstTodoTime
    : getLastDate(sprintStartDate, createdAt);
  const finalTime = getFirstNoteDateByAction(movements, DOING_LABEL, 'add');
  return new Date(finalTime) - new Date(initialTime);
};

const issuePickupTime = R.pipe(
  filterNecessaryData,
  pickupTime
);

module.exports = issuePickupTime;
