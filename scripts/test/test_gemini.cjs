const https = require('https');
const data = JSON.stringify({
  contents: [{ parts: [{ text: "Hello" }] }]
});

const req = https.request('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyAf0RO0amL4BLkYrfNdDqrJwNUHf0pi7U0', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log('Response:', body));
});
req.on('error', console.error);
req.write(data);
req.end();
