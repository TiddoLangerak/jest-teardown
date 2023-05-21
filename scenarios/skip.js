const { cleanup } = require('../index.js');
const { log } = require('./util.js');

describe("skip", () => {
  test.skip("skip test", () => {
    log("skip test");
    cleanup(() => log("cleanup skip"));
  });

  test.skip.each([
    [1,2,3],
    [2,3,4]
  ])('skip each', (a, b, c) => {
    log(`skip each ${a} ${b} ${c}`);
    cleanup(() => log(`cleanup skip each ${a} ${b} ${c}`));
  });

  test.skip.failing('skip failing', () => {
    log(`skip failing`);
    cleanup(() => log(`cleanup skip failing`));
    expect(true).toBe(false);
  });

  // Should run due to skips
  test("test", () => {
    log("test");
  });

});
