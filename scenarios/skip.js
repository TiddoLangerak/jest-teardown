const { teardown } = require('../index.js');
const { log } = require('./util.js');

describe("skip", () => {
  test.skip("skip test", () => {
    log("skip test");
    teardown(() => log("teardown skip"));
  });

  test.skip.each([
    [1,2,3],
    [2,3,4]
  ])('skip each', (a, b, c) => {
    log(`skip each ${a} ${b} ${c}`);
    teardown(() => log(`teardown skip each ${a} ${b} ${c}`));
  });

  test.skip.failing('skip failing', () => {
    log(`skip failing`);
    teardown(() => log(`teardown skip failing`));
    expect(true).toBe(false);
  });

  // Should run due to skips
  test("test", () => {
    log("test");
  });

});
