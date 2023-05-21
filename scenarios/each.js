const { teardown } = require('../index.js');
const { log } = require('./util.js');

describe("each", () => {
  test.each([
    [1,2,3],
    [2,3,4]
  ])('each', (a, b, c) => {
    log(`each ${a} ${b} ${c}`);
    teardown(() => log(`teardown ${a} ${b} ${c}`));
  });

  test.each`
  a    | b    | c
  ${1} | ${2} | ${3}
  ${2} | ${3} | ${4}
  `('template', ({ a, b, c }) => {
    log(`template ${a} ${b} ${c}`);
    teardown(() => log(`teardown template ${a} ${b} ${c}`));
  });
});
