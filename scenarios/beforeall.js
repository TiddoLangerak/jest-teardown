const { cleanup } = require('../index.js');
const { log } = require('./util.js');

describe('suite', () => {
  beforeAll(() => {
    log("Before all");
    cleanup(() => log("Cleanup"));
  });
  test("test1", () => log("test 1"));
  test("test2", () => log("test 2"));
});
