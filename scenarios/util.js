const net = require('node:net');
const path = require('node:path');
const url = require('url');

const sockPath = path.join(__dirname, '..', 'test.sock');

function log(line) {
  const sock = net.createConnection(sockPath);
  sock.end(`${line}\n`);
  console.log(line);
}

module.exports = { log };
