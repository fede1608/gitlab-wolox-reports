require('dotenv').config();
const readline = require('readline');
const axios = require('axios');
const moment = require('moment');
const fs = require('fs');
const csvparse = require('json2csv').parse;

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
  return ask('Enter Gitlab Api Token: ').then(token => {
    fs.writeFileSync('./.env', `API_TOKEN=${token}`);
    return exec();
  });
}

function exec() {
  return ask('Enter milestone name: ')
    .then(answer => {
      this.milestone = answer;
      return get('milestones').then(milestones => {
        const milestone = milestones.find(ms => ms.title.toLowerCase() === answer.toLowerCase());
        console.log(`Milestone: ${milestone.title} Start Date: ${milestone.start_date} End Date: ${milestone.due_date}`);
        return get(`issues?milestone=${milestone.title}`);
      });
    })
    .then(issues => {
      const data = issues.map(is => ({
        id: is.iid,
        title: is.title,
        time: moment(is.closed_at).diff(moment(is.created_at), 'days')+1
      }));
      const csv = csvparse(data);
      console.log(csv);
      const filename = `./Linio-Thor Report - ${this.milestone.toUpperCase()} - ${new Date().getTime()}.csv`;
      fs.writeFileSync(filename, csv);
      process.exit(0);
    });
}
if (!process.env.API_TOKEN) {
  initEnv();
} else {
  exec();
}

