import { cleanup } from '../index.js';
import { log } from './util.js'

describe("failing", () => {
  test.failing("failing test", () => {
    log("failing test");
    cleanup(() => log("cleanup failing"));
    expect(true).toBe(false);
  });

  test.failing.each([
    [1,2,3],
    [2,3,4]
  ])('failing each', (a, b, c) => {
    log(`failing each ${a} ${b} ${c}`);
    cleanup(() => log(`cleanup failing each ${a} ${b} ${c}`));
    expect(true).toBe(false);
  });

});
