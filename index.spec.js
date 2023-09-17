/**
 * This test class runs a little bit different from your normal unit test class:
 * Since most of `jest-teardown` logic runs _after test completion_, we cannot actually
 * test this logic directly from within a test.
 *
 * Therefore, our approach towards testing is to spin up scenarios in a separate jest process,
 * and send back any relevant information back to the main jest process.
 * Then, in the main process we can validate this information, as well as validate the output of the process when applicable.
 *
 * So the basic anatomy is this:
 * - We spin up our socket
 * - We run a scenario (from `scenarios/`) in a new jest process
 * - This process sends information back to our process
 * - Once the scenario finishes, we validate this information
 */
const net = require('node:net');
const path = require('node:path');
const url = require('url');
const cp = require('node:child_process');
const fs = require('node:fs/promises');

const sockPath = path.join(__dirname, 'test.sock');

describe('teardown', () => {

  let server;
  let data = '';
  async function teardownSocket() {
    try {
      await fs.unlink(sockPath);
    } catch (e) {}
  }
  beforeAll(async () => {
    await teardownSocket();
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
    await teardownSocket();
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
        "Inner teardown",
        "Inner before all 2",
        "test 3",
        "test 4",
        "Inner teardown 2",
        "Outer teardown",
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
        "Inner teardown",
        "Outer teardown",
        "Outer before each",
        "Inner before each",
        "test 2",
        "Inner teardown",
        "Outer teardown",
        ""
      ].join('\n'));
    });
  });

  describe('when placed in a test', () => {
    test('it runs after the test', async () => {
      await runScenario('test_it', true);
      expect(data).toBe([
        "succeeding test",
        "teardown succeeding test",
        "succeeding it",
        "teardown succeeding it",
        "failing test",
        "teardown failing test",
        "failing it",
        "teardown failing it",
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
        "teardown succeeding test",
        "teardown each",
        "beforeEach",
        "failing it",
        "teardown failing it",
        "teardown each",
        "teardown all",
        ""
      ].join('\n'));
    });
  });

  describe('outside of a test or hook', () => {
    test('it throws an error', async () => {
      await runScenario('outside');
      expect(data).toBe([
        "before: teardown can only be called from within `beforeAll`, `beforeEach`, `test` or `it`. It cannot be called from concurrent tests.",
        "inner before: teardown can only be called from within `beforeAll`, `beforeEach`, `test` or `it`. It cannot be called from concurrent tests.",
        "inner after: teardown can only be called from within `beforeAll`, `beforeEach`, `test` or `it`. It cannot be called from concurrent tests.",
        "after: teardown can only be called from within `beforeAll`, `beforeEach`, `test` or `it`. It cannot be called from concurrent tests.",
        ""
      ].join('\n'));
    });
  });

  describe('in a concurrent test', () => {
    test('it throws an error when using a teardown hook', async () => {
      await runScenario('concurrent');
      expect(data).toBe([
        "non-teardown test",
        "teardown test",
        "teardown can only be called from within `beforeAll`, `beforeEach`, `test` or `it`. It cannot be called from concurrent tests.",
        ""
      ].join('\n'));
    });
  });

  describe('in a test.each', () => {
    test('it runs after each test', async () => {
      await runScenario('each');
      expect(data).toBe([
        "each 1 2 3",
        "teardown 1 2 3",
        "each 2 3 4",
        "teardown 2 3 4",
        "template 1 2 3",
        "teardown template 1 2 3",
        "template 2 3 4",
        "teardown template 2 3 4",
        ""
      ].join('\n'));
    });
  });
  describe('in a test.failing', () => {
    test('it runs after the test', async () => {
      await runScenario('failing');
      expect(data).toBe([
        "failing test",
        "teardown failing",
        "failing each 1 2 3",
        "teardown failing each 1 2 3",
        "failing each 2 3 4",
        "teardown failing each 2 3 4",
        ""
      ].join('\n'));
    });
  });

  describe('in a test.only', () => {
    test('it runs after the test', async () => {
      await runScenario("only");
      expect(data).toBe([
        "only test",
        "teardown only",
        "only each 1 2 3",
        "teardown only each 1 2 3",
        "only each 2 3 4",
        "teardown only each 2 3 4",
        "only failing",
        "teardown only failing",
        ""
      ].join('\n'));
    });
  });
  describe('a test.skip', () => {
    test("doesn't throw and the test doesn't run", async () => {
      await runScenario("skip");
      expect(data).toBe([
        "test",
        ""
      ].join('\n'));
    });
  });
  describe('a test.todo', () => {
    test("doesn't throw and the test doesn't run", async () => {
      await runScenario("todo");
      expect(data).toBe([
        "test",
        ""
      ].join('\n'));
    });
  });

});

async function runScenario(scenario, expectError = false) {
    await new Promise((resolve, reject) => {
      const res = cp.exec(
        `node_modules/.bin/jest --runTestsByPath scenarios/${scenario}.js --testRegex=.*`,
        {},
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
