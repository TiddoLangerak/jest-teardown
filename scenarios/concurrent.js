const { teardown } = require('../index.js');
const { log } = require('./util.js');

describe("concurrent", () => {
  test.concurrent("non-teardown test", () => {
    log("non-teardown test");
  });
  test.concurrent("teardown test", async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    log("teardown test");
    try {
      teardown(() => {});
    } catch (e) {
      log(e.message);
    }
  });
});
