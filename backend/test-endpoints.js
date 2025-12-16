import http from 'http';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`${path}: ${res.statusCode}`);
        console.log(data);
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error(`Request to ${path} failed:`, error.message);
      reject(error);
    });

    req.end();
  });
}

async function test() {
  try {
    await makeRequest('/api/health');
    console.log('\n---\n');
    await makeRequest('/api/groups/list');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

test();
