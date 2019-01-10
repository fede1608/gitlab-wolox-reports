require('dotenv').config();
const readline = require('readline');
const axios = require('axios');

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
    const fs = require('fs');
    fs.writeFileSync('./.env', `API_TOKEN=${token}`);
    return exec();
  });
}

function exec() {
  return ask('Enter milestone name: ')
    .then(answer => {
      return get('milestones').then(milestones => {
        const milestone = milestones.find(ms => ms.title.toLowerCase() === answer.toLowerCase());
        console.log(`Milestone: ${milestone.title} Start Date: ${milestone.start_date} End Date: ${milestone.due_date}`);
        return get(`issues?milestone=${milestone.title}`);
      });
    })
    .then(issues => {
      issues.forEach(element => {
        console.log(element.title);
      });
      process.exit(0);
    });
}
if (!process.env.API_TOKEN) {
  initEnv();
} else {
  exec();
}

