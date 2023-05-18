import net from 'node:net';
import path from 'node:path';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const sockPath = path.join(__dirname, '..', 'test.sock');

export function log(line) {
  const sock = net.createConnection(sockPath);
  sock.end(`${line}\n`);
  console.log(line);
}

