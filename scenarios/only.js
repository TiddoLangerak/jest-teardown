import { cleanup } from '../index.js';
import { log } from './util.js'

describe("only", () => {
  test.only("only test", () => {
    log("only test");
    cleanup(() => log("cleanup only"));
  });

  test.only.each([
    [1,2,3],
    [2,3,4]
  ])('only each', (a, b, c) => {
    log(`only each ${a} ${b} ${c}`);
    cleanup(() => log(`cleanup only each ${a} ${b} ${c}`));
  });

  test.only.failing('only failing', () => {
    log(`only failing`);
    cleanup(() => log(`cleanup only failing`));
    expect(true).toBe(false);
  });

  // Should be skipped due to onlies
  test("skipped", () => {
    log("skipped test");
  });

});
