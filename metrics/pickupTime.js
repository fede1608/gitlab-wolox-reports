/**
 * pickupTime
 * @param {Array<{ issue }>} issues
 * @return { Integer, Float, String}
 */

const R = require('ramda');
const moment = require('moment');

const {
  average,
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

const pickupTimeBreakdown = R.map(issuePickupTime);

module.exports = issues => {
  const breakdown = pickupTimeBreakdown(issues);
  const miliseconds = average(breakdown);
  const formated = moment.duration(miliseconds, 'ms').humanize();

  return { count: breakdown.length, miliseconds, formated };
};
