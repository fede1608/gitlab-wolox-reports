const axios = require('axios');

exports.get = path => {
  return axios({
    method: 'get',
    baseURL: 'https://fala.cl/api/v4/projects/223/',
    url: path,
    port: 443,
    headers: { 'PRIVATE-TOKEN': process.env.API_TOKEN },
    httpsAgent: this.httpsAgent
  })
    .then(res => res.data)
    .catch(err => {
      console.log(err);
      if (err.response.status === 401) {
        throw err;
      }
    });
};
