const { teardown } = require('../index.js');
const { log } = require('./util.js');

describe('suite', () => {
  beforeAll(() => {
    log("Outer before all");
    teardown(() => log("Outer teardown"));
  });
  describe("inner suite", () => {
    beforeAll(() => {
      log("Inner before all");
      teardown(() => log("Inner teardown"));
    });
    test("test1", () => log("test 1"));
    test("test2", () => log("test 2"));
  });

  describe("inner suite 2", () => {
    beforeAll(() => {
      log("Inner before all 2");
      teardown(() => log("Inner teardown 2"));
    });
    test("test3", () => log("test 3"));
    test("test4", () => log("test 4"));
  });
});
