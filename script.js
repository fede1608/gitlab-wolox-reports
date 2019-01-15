#!/usr/bin/env node
const dotenv = require('dotenv');
const readline = require('readline');
const axios = require('axios');
const moment = require('moment');
const fs = require('fs');
const opn = require('opn');
const csvparse = require('json2csv').parse;

const generateMovementsFromNotes = require('./service/movements');
const getPickupTime = require('./metrics/pickupTime');
const { parseTime, getFirstNoteDateByAction } = require('./metrics/utils');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function get(path) {
  return axios({
    method: 'get',
    baseURL: 'https://fala.cl/api/v4/projects/223/',
    url: path,
    port: 443,
    headers: { 'PRIVATE-TOKEN': process.env.API_TOKEN },
    httpsAgent: this.httpsAgent
  }).then(res => res.data);
}
function ask(data) {
  return new Promise(resolve => {
    rl.question(data, input => resolve(input));
  });
}

function initEnv() {
  opn('https://fala.cl/profile/personal_access_tokens');
  console.log('Get a Access Token from here: https://fala.cl/profile/personal_access_tokens');
  return ask('Enter Gitlab Api Token: ').then(token => {
    fs.writeFileSync('./.env', `API_TOKEN=${token}`);
    dotenv.load();
    return exec();
  });
}

function getMergeTime(issue) {
  if (!issue.closed_at) return null;
  if (issue.movements['CODE REVIEW']) {
    return moment(issue.closed_at).diff(getFirstNoteDateByAction(issue.movements, 'CODE REVIEW', 'add'), 'ms');
  }
  return moment(issue.closed_at).diff(getFirstNoteDateByAction(issue.movements, 'DEVELOPED', 'add'), 'ms');
}

function getLifecycleTime(issue) {
  if (!issue.movements.DOING) return null;
  if (!issue.closed_at) return null;
  return moment(issue.closed_at).diff(getFirstNoteDateByAction(issue.movements, 'DOING', 'add'), 'ms');
}

function getQAPickupTime(issue) {
  if (!issue.movements.TESTING) return null;
  return getFirstNoteDateByAction(issue.movements, 'TESTING', 'add').diff(getFirstNoteDateByAction(issue.movements, 'DEVELOPED', 'add'), 'ms');
}

function getQARejections(issue) {
  if (!issue.movements.TESTING) return 0;
  return issue.movements.TESTING.filter(n => n.action === 'add').length - 1;
}

const addNotesToIssue = issue => {
  return get(`/issues/${issue.iid}/resource_label_events`)
    .then(generateMovementsFromNotes)
    .then(movements => ({ ...issue, movements }));
};

function exec() {
  return ask('Enter sprint number: ')
    .then(answer => {
      this.milestone = `SPRINT ${answer}`;
      return get('milestones');
    })
    .then(milestones => {
      const milestone = milestones.find(ms => ms.title.toLowerCase() === this.milestone.toLowerCase());
      console.log(`Milestone: ${milestone.title} Start Date: ${milestone.start_date} End Date: ${milestone.due_date}`);
      return get(`issues?milestone=${milestone.title}`);
    })
    .then(issues => {
      console.log('Fetching notes from issues');
      return Promise.all(issues.map(addNotesToIssue));
    })
    .then(issues => {
      const data = issues.map(is => ({
        id: is.iid,
        title: is.title,
        sprint: this.milestone,
        pickup_time: parseTime(getPickupTime(is)),
        merge_time: parseTime(getMergeTime(is)),
        lifecycle: parseTime(getLifecycleTime(is)),
        qa_pickup_time: parseTime(getQAPickupTime(is)),
        qa_rejections: getQARejections(is)
      }));
      const csv = csvparse(data);
      const filename = `./Linio-Thor Report - ${this.milestone.toUpperCase()} - ${new Date().getTime()}.csv`;
      fs.writeFileSync(filename, csv);
      console.log(`File "${filename}" successfully created on current dir.`);
      process.exit(0);
    })
    .catch(err => {
      console.log(err.Error || err);
      process.exit(1);
    });
}

dotenv.load();
if (!process.env.API_TOKEN) {
  initEnv();
} else {
  exec();
}
