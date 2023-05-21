const { cleanup } = require('../index.js');
const { log } = require('./util.js');

describe('suite', () => {
  beforeEach(() => {
    log("Outer before each");
    cleanup(() => log("Outer cleanup"));
  });
  describe("inner suite", () => {
    beforeEach(() => {
      log("Inner before each");
      cleanup(() => log("Inner cleanup"));
    });
    test("test1", () => log("test 1"));
    test("test2", () => log("test 2"));
  });
});
