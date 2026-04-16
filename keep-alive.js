const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const serverPath = path.join(__dirname, '.next/standalone/server.js');
const PORT = 3000;

function ping() {
  const req = http.get(`http://localhost:${PORT}/login`, (res) => {
    res.resume();
  });
  req.on('error', () => {});
  req.setTimeout(2000, () => req.destroy());
}

function startServer() {
  const child = spawn('node', [serverPath, '-H', '0.0.0.0', '-p', String(PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=512' }
  });

  child.stdout.on('data', (data) => process.stdout.write(data));
  child.stderr.on('data', (data) => process.stderr.write(data));

  child.on('exit', (code, signal) => {
    console.log(`[${new Date().toISOString()}] Server exited. Code: ${code}, Signal: ${signal}. Restarting...`);
    setTimeout(startServer, 2000);
  });

  child.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] Error:`, err.message);
    setTimeout(startServer, 2000);
  });
}

startServer();

// Keep-alive ping every 3 seconds
setInterval(ping, 3000);
// Initial ping after 2s
setTimeout(ping, 2000);
