const { teardown } = require('../index.js');
const { log } = require('./util.js');

describe("failing", () => {
  test.failing("failing test", () => {
    log("failing test");
    teardown(() => log("teardown failing"));
    expect(true).toBe(false);
  });

  test.failing.each([
    [1,2,3],
    [2,3,4]
  ])('failing each', (a, b, c) => {
    log(`failing each ${a} ${b} ${c}`);
    teardown(() => log(`teardown failing each ${a} ${b} ${c}`));
    expect(true).toBe(false);
  });

});
