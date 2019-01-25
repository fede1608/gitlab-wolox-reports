const moment = require('moment');
const { get } = require('../service/api');

const getFirstCommentOrApprovedDate = notes => {
  return notes.filter(note => note.body.includes('approved this merge request') || note.type === 'DiffNote')
    .reduce((prev, curr) => {
      if (!prev || moment(curr.created_at) < prev) {
        prev = moment(curr.created_at);
      }
      return prev;
    }, null);
};

const getDiffTime = (first, last) => {
  return moment(last).diff(moment(first), 'ms');
};

module.exports = notes => {
  return Promise
    .all(notes
      .filter(note => note.body.includes('mentioned in merge request !'))
      .map(note => note.body.replace('mentioned in merge request !', ''))
      .map(mrId => {
        return Promise.all([get(`/merge_requests/${mrId}`), get(`/merge_requests/${mrId}/notes`)])
          .then(result => {
            return ({ id: mrId, title: result[0].title, pickupTime: getDiffTime(result[0].created_at, getFirstCommentOrApprovedDate(result[1])) });
          })
          .catch(error => ({ error }));
      }))
    .catch(console.log);
};
