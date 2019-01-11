#!/usr/bin/env node
const dotenv = require('dotenv');
const readline = require('readline');
const axios = require('axios');
const moment = require('moment');
const fs = require('fs');
const opn = require('opn');
const csvparse = require('json2csv').parse;

const generateMovementsFromNotes = require('./service/movements');

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
        time: moment(is.closed_at).diff(moment(is.created_at), 'days') + 1
      }));
      const csv = csvparse(data);
      console.log(csv);
      const filename = `./Linio-Thor Report - ${this.milestone.toUpperCase()} - ${new Date().getTime()}.csv`;
      fs.writeFileSync(filename, csv);
      process.exit(0);
    })
    .catch(err => {
      console.log(err.Error);
      process.exit(1);
    });
}

dotenv.load();
if (!process.env.API_TOKEN) {
  initEnv();
} else {
  exec();
}

