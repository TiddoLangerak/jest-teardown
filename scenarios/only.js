const { teardown } = require('../index.js');
const { log } = require('./util.js');

describe("only", () => {
  test.only("only test", () => {
    log("only test");
    teardown(() => log("teardown only"));
  });

  test.only.each([
    [1,2,3],
    [2,3,4]
  ])('only each', (a, b, c) => {
    log(`only each ${a} ${b} ${c}`);
    teardown(() => log(`teardown only each ${a} ${b} ${c}`));
  });

  test.only.failing('only failing', () => {
    log(`only failing`);
    teardown(() => log(`teardown only failing`));
    expect(true).toBe(false);
  });

  // Should be skipped due to onlies
  test("skipped", () => {
    log("skipped test");
  });

});
