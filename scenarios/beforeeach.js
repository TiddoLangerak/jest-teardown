const { teardown } = require('../index.js');
const { log } = require('./util.js');

describe('suite', () => {
  beforeEach(() => {
    log("Before each");
    teardown(() => log("Cleanup"));
  });
  test("test1", () => log("test 1"));
  test("test2", () => log("test 2"));
});
