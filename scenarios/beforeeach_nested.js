const { teardown } = require('../index.js');
const { log } = require('./util.js');

describe('suite', () => {
  beforeEach(() => {
    log("Outer before each");
    teardown(() => log("Outer teardown"));
  });
  describe("inner suite", () => {
    beforeEach(() => {
      log("Inner before each");
      teardown(() => log("Inner teardown"));
    });
    test("test1", () => log("test 1"));
    test("test2", () => log("test 2"));
  });
});
