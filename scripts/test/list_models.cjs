const https = require('https');

let allModels = [];

function fetchModels(pageToken = '') {
  let url = 'https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyAf0RO0amL4BLkYrfNdDqrJwNUHf0pi7U0';
  if (pageToken) url += '&pageToken=' + pageToken;
  
  https.get(url, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const parsed = JSON.parse(data);
      if (parsed.models) {
        allModels = allModels.concat(parsed.models.map(m => m.name));
      }
      if (parsed.nextPageToken) {
        fetchModels(parsed.nextPageToken);
      } else {
        console.log(allModels.join('\n'));
      }
    });
  });
}

fetchModels();
