import net from 'node:net';
import path from 'node:path';
import * as url from 'url';
import cp from 'node:child_process';
import fs from 'node:fs/promises';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const sockPath = path.join(__dirname, 'test.sock');



describe('cleanup', () => {

  let server;
  let data = '';
  async function cleanupSocket() {
    try {
      await fs.unlink(sockPath);
    } catch (e) {}
  }
  beforeAll(async () => {
    await cleanupSocket();
    server = net.createServer(c => {
      c.on('data', (d) => {
        data += d.toString();
      });
    });
    await new Promise(resolve => {
      server.listen(sockPath, () => {
        resolve();
      });
    });
  });

  beforeEach(() => {
    data = '';
  });

  afterAll(async () => {
    server.close();
    await cleanupSocket();
  });

  describe('when placed in a beforeAll', () => {
    test('it runs after the suite has completed', async () => {
      await runScenario('beforeall');
      expect(data).toBe([
        "Before all",
        "test 1",
        "test 2",
        "Cleanup",
        ""
      ].join('\n'));
    });
  });

  describe('when placed in a beforeAll (nested)', () => {
    test('it runs after each test', async () => {
      await runScenario('beforeall_nested');
      expect(data).toBe([
        "Outer before all",
        "Inner before all",
        "test 1",
        "test 2",
        "Inner cleanup",
        "Inner before all 2",
        "test 3",
        "test 4",
        "Inner cleanup 2",
        "Outer cleanup",
        ""
      ].join('\n'));
    });
  });

  describe('when placed in a beforeEach', () => {
    test('it runs after each test', async () => {
      await runScenario('beforeeach');
      expect(data).toBe([
        "Before each",
        "test 1",
        "Cleanup",
        "Before each",
        "test 2",
        "Cleanup",
        ""
      ].join('\n'));
    });
  });

  describe('when placed in a beforeEach (nested)', () => {
    test('it runs after each test', async () => {
      await runScenario('beforeeach_nested');
      expect(data).toBe([
        "Outer before each",
        "Inner before each",
        "test 1",
        "Inner cleanup",
        "Outer cleanup",
        "Outer before each",
        "Inner before each",
        "test 2",
        "Inner cleanup",
        "Outer cleanup",
        ""
      ].join('\n'));
    });
  });

});

async function runScenario(scenario) {
    await new Promise((resolve, reject) => {
      const res = cp.exec(
        `node_modules/.bin/jest --runTestsByPath scenarios/${scenario}.js --testRegex=.*`,
        { env: { ...process.env, NODE_OPTIONS: "--experimental-vm-modules" }},
        (err, stdout, stderr) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
}
