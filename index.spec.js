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

  describe('when placed in a test', () => {
    test('it runs after the test', async () => {
      await runScenario('test_it', true);
      expect(data).toBe([
        "succeeding test",
        "cleanup succeeding test",
        "succeeding it",
        "cleanup succeeding it",
        "failing test",
        "cleanup failing test",
        "failing it",
        "cleanup failing it",
        ""
      ].join('\n'));
    });
  });

  describe('an async test', () => {
    test('it runs at the appropriate times', async () => {
      await runScenario('async', true);
      expect(data).toBe([
        "beforeAll",
        "beforeEach",
        "succeeding test",
        "cleanup succeeding test",
        "cleanup each",
        "beforeEach",
        "failing it",
        "cleanup failing it",
        "cleanup each",
        "cleanup all",
        ""
      ].join('\n'));
    });
  });

  describe('outside of a test or hook', () => {
    test('it throws an error', async () => {
      await runScenario('outside');
      expect(data).toBe([
        "cleanup can only be called from within `beforeAll`, `beforeEach`, `test` or `it`. It cannot be called from concurrent tests.",
        ""
      ].join('\n'));
    });
  });

  describe('in a concurrent test', () => {
    test('it throws an error when using a cleanup hook', async () => {
      await runScenario('concurrent');
      expect(data).toBe([
        "non-cleanup test",
        "cleanup test",
        "cleanup can only be called from within `beforeAll`, `beforeEach`, `test` or `it`. It cannot be called from concurrent tests.",
        ""
      ].join('\n'));
    });
  });

  describe('in a test.each', () => {
    test('it runs after each test', async () => {
      await runScenario('each');
      expect(data).toBe([
        "each 1 2 3",
        "cleanup 1 2 3",
        "each 2 3 4",
        "cleanup 2 3 4",
        "template 1 2 3",
        "cleanup template 1 2 3",
        "template 2 3 4",
        "cleanup template 2 3 4",
        ""
      ].join('\n'));
    });
  });
  describe('in a test.failing', () => {
    test('it runs after the test', async () => {
      await runScenario('failing');
      expect(data).toBe([
        "failing test",
        "cleanup failing",
        "failing each 1 2 3",
        "cleanup failing each 1 2 3",
        "failing each 2 3 4",
        "cleanup failing each 2 3 4",
        ""
      ].join('\n'));
    });
  });

  describe('in a test.only', () => {
    test('it runs after the test', async () => {
      await runScenario("only");
      expect(data).toBe([
        "only test",
        "cleanup only",
        "only each 1 2 3",
        "cleanup only each 1 2 3",
        "only each 2 3 4",
        "cleanup only each 2 3 4",
        "only failing",
        "cleanup only failing",
        ""
      ].join('\n'));
    });
  });
  describe.skip('a test.skip.failing', () => {
    test("doesn't run", async () => {
      throw new Error("TODO");
    });
  });
  describe.skip('a test.skip', () => {
    test("doesn't run", async () => {
      throw new Error("TODO");
    });
  });
  describe.skip('a test.skip.each', () => {
    test("doesn't run", async () => {
      throw new Error("TODO");
    });
  });
  describe.skip('a test.todo', () => {
    test("doesn't run", async () => {
      throw new Error("TODO");
    });
  });

});

async function runScenario(scenario, expectError = false) {
    await new Promise((resolve, reject) => {
      const res = cp.exec(
        `node_modules/.bin/jest --runTestsByPath scenarios/${scenario}.js --testRegex=.*`,
        { env: { ...process.env, NODE_OPTIONS: "--experimental-vm-modules" }},
        (err, stdout, stderr) => {
          if (err && !expectError) {
            console.log({ stdout, stderr });
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
}
