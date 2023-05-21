const { teardown } = require('../index.js');
const { log } = require('./util.js');

describe("todo", () => {
  test.todo("todo test");
  test("test", () => {
    log("test");
  });
});
